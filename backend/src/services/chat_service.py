"""Chat service: orchestrates Cohere agent with tool use and conversation persistence."""

import json
import logging
import uuid
from typing import Optional
from datetime import datetime

import cohere
from sqlmodel import Session, select

from ..models.conversation import Conversation, Message, ToolCallInfo
from ..models.todo import TodoCreate, TodoUpdate
from ..services.todo_service import TodoService
from ..database import engine
from ..config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a task management assistant. You help users manage their todo list through natural language conversation.

You have access to tools to manage tasks: add_task, list_tasks, complete_task, delete_task, update_task.

Guidelines:
- Be concise and helpful
- Confirm actions after completing them
- If a request is ambiguous, ask for clarification
- If a tool returns an error, explain it in friendly terms
- Only discuss task management topics
"""

# Cohere tool definitions (function-calling format)
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Create a new task for the user",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Task title (1-255 chars)",
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional task description (max 1000 chars)",
                    },
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "List the user's tasks with optional status filter",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "Filter: 'all', 'pending', or 'completed' (default: 'all')",
                        "enum": ["all", "pending", "completed"],
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "Mark a task as completed",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "UUID of the task to complete",
                    },
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Delete a task permanently",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "UUID of the task to delete",
                    },
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update a task's title or description",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "UUID of the task to update",
                    },
                    "title": {
                        "type": "string",
                        "description": "New title (optional)",
                    },
                    "description": {
                        "type": "string",
                        "description": "New description (optional)",
                    },
                },
                "required": ["task_id"],
            },
        },
    },
]


def _execute_tool(tool_name: str, args: dict, user_id: str) -> str:
    """Execute a tool call directly using TodoService.

    Returns JSON string with {success, data/error}.
    """
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        return json.dumps({"success": False, "error": "Invalid user_id"})

    try:
        with Session(engine) as db_session:
            if tool_name == "add_task":
                title = args.get("title", "").strip()
                description = args.get("description", "")
                if not title:
                    return json.dumps({"success": False, "error": "title is required"})
                todo_create = TodoCreate(title=title, description=description or None)
                todo = TodoService.create_todo(db_session, todo_create, uid)
                return json.dumps({
                    "success": True,
                    "data": {"task_id": str(todo.id), "title": todo.title, "status": "created"}
                })

            elif tool_name == "list_tasks":
                status = args.get("status", "all")
                if status not in ("all", "pending", "completed"):
                    status = "all"
                completed_filter = None
                if status == "pending":
                    completed_filter = False
                elif status == "completed":
                    completed_filter = True
                todos = TodoService.get_todos(db_session, uid, completed=completed_filter)
                tasks = [
                    {
                        "id": str(t.id),
                        "title": t.title,
                        "description": t.description,
                        "completed": t.completed,
                    }
                    for t in todos
                ]
                return json.dumps({
                    "success": True,
                    "data": {"tasks": tasks, "count": len(tasks), "status_filter": status}
                })

            elif tool_name == "complete_task":
                tid = uuid.UUID(args.get("task_id", ""))
                todo = TodoService.get_todo_by_id(db_session, tid, uid)
                if not todo:
                    return json.dumps({"success": False, "error": "Task not found"})
                if todo.completed:
                    return json.dumps({
                        "success": True,
                        "data": {"task_id": str(todo.id), "title": todo.title, "status": "completed", "note": "Already completed"}
                    })
                updated = TodoService.toggle_completion(db_session, tid, uid)
                return json.dumps({
                    "success": True,
                    "data": {"task_id": str(updated.id), "title": updated.title, "status": "completed"}
                })

            elif tool_name == "delete_task":
                tid = uuid.UUID(args.get("task_id", ""))
                todo = TodoService.get_todo_by_id(db_session, tid, uid)
                if not todo:
                    return json.dumps({"success": False, "error": "Task not found"})
                title = todo.title
                deleted = TodoService.delete_todo(db_session, tid, uid)
                if not deleted:
                    return json.dumps({"success": False, "error": "Failed to delete task"})
                return json.dumps({
                    "success": True,
                    "data": {"task_id": str(tid), "title": title, "status": "deleted"}
                })

            elif tool_name == "update_task":
                tid = uuid.UUID(args.get("task_id", ""))
                title = args.get("title", "").strip()
                description = args.get("description", "").strip()
                if not title and not description:
                    return json.dumps({"success": False, "error": "At least one of title or description required"})
                update_data = {}
                if title:
                    update_data["title"] = title
                if description:
                    update_data["description"] = description
                todo_update = TodoUpdate(**update_data)
                updated = TodoService.update_todo(db_session, tid, uid, todo_update)
                if not updated:
                    return json.dumps({"success": False, "error": "Task not found"})
                return json.dumps({
                    "success": True,
                    "data": {"task_id": str(updated.id), "title": updated.title, "status": "updated"}
                })

            else:
                return json.dumps({"success": False, "error": f"Unknown tool: {tool_name}"})

    except ValueError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.exception(f"Tool execution failed: {tool_name}")
        return json.dumps({"success": False, "error": f"Failed to execute {tool_name}"})


async def process_chat_message(
    user_id: str,
    message: str,
    conversation_id: Optional[int],
    session: Session,
) -> dict:
    """Process a chat message: persist, invoke Cohere agent, return response."""

    # Step 1: Fetch or create Conversation
    if conversation_id is not None:
        conversation = session.get(Conversation, conversation_id)
        if conversation is None:
            raise ValueError("Conversation not found")
        if conversation.user_id != user_id:
            raise PermissionError("Conversation does not belong to the authenticated user")
    else:
        conversation = Conversation(user_id=user_id)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    # Step 2: Load message history
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    )
    history_messages = session.exec(stmt).all()

    # Step 3: Store user's message
    user_msg = Message(
        conversation_id=conversation.id,
        user_id=user_id,
        role="user",
        content=message,
    )
    session.add(user_msg)
    session.commit()
    session.refresh(user_msg)

    # Step 4: Build Cohere messages from history
    cohere_messages = []
    for msg in history_messages:
        cohere_messages.append({"role": msg.role, "content": msg.content})
    cohere_messages.append({"role": "user", "content": message})

    # Step 5: Call Cohere with tool use loop
    tool_calls_info = []
    final_response = ""

    try:
        co = cohere.ClientV2(api_key=settings.COHERE_API_KEY)

        # Multi-turn tool use loop (max 5 iterations to prevent infinite loops)
        for _ in range(5):
            response = co.chat(
                model="command-r-plus-08-2024",
                messages=[{"role": "system", "content": SYSTEM_PROMPT}] + cohere_messages,
                tools=TOOLS,
            )

            # Check if the model wants to call tools
            if response.message.tool_calls:
                # Add assistant message with tool calls and tool_plan
                assistant_msg_data = {
                    "role": "assistant",
                    "tool_calls": response.message.tool_calls,
                }
                if response.message.tool_plan:
                    assistant_msg_data["tool_plan"] = response.message.tool_plan
                cohere_messages.append(assistant_msg_data)

                # Execute each tool call and add individual tool result messages
                for tc in response.message.tool_calls:
                    tool_name = tc.function.name
                    try:
                        tool_args = json.loads(tc.function.arguments) if isinstance(tc.function.arguments, str) else tc.function.arguments
                    except (json.JSONDecodeError, TypeError):
                        tool_args = {}

                    result_str = _execute_tool(tool_name, tool_args, user_id)

                    # Parse result for ToolCallInfo
                    try:
                        result_data = json.loads(result_str)
                    except (json.JSONDecodeError, TypeError):
                        result_data = {"raw": result_str}

                    tool_calls_info.append(ToolCallInfo(
                        tool=tool_name,
                        arguments=tool_args,
                        result=result_data if isinstance(result_data, dict) else {"output": result_data},
                    ))

                    # Each tool result is a separate message
                    cohere_messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": result_str,
                    })
            else:
                # No tool calls — extract final text response
                if response.message.content:
                    final_response = response.message.content[0].text if response.message.content else ""
                break
        else:
            # Exhausted loop — use last response
            if response.message.content:
                final_response = response.message.content[0].text if response.message.content else ""

    except Exception as e:
        logger.exception("Cohere agent invocation failed")
        raise RuntimeError(f"An error occurred processing your message. Please try again.") from e

    # Step 6: Store assistant's message
    assistant_msg = Message(
        conversation_id=conversation.id,
        user_id=user_id,
        role="assistant",
        content=final_response,
    )
    session.add(assistant_msg)

    # Step 7: Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    session.add(conversation)
    session.commit()
    session.refresh(assistant_msg)

    return {
        "conversation_id": conversation.id,
        "message_id": assistant_msg.id,
        "response": final_response,
        "tool_calls": [tc.model_dump() for tc in tool_calls_info],
    }
