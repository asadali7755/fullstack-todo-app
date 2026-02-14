"""Chat service: orchestrates agent invocation and conversation persistence."""

import json
import logging
import sys
from typing import Optional
from datetime import datetime

from sqlmodel import Session, select
import os
from agents import Agent, Runner, RunConfig, set_default_openai_key
from agents.mcp import MCPServerStdio
from agents import ToolCallItem, ToolCallOutputItem

from ..models.conversation import Conversation, Message, ToolCallInfo
from ..config import settings

logger = logging.getLogger(__name__)

# Ensure OpenAI API key is available to the agents SDK
if settings.OPENAI_API_KEY:
    set_default_openai_key(settings.OPENAI_API_KEY)
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY

AGENT_SYSTEM_PROMPT = """You are a task management assistant. You help users manage their todo list through natural language conversation.

You have access to the following tools:
- add_task: Create a new task
- list_tasks: Show the user's tasks (all, pending, or completed)
- complete_task: Mark a task as done
- delete_task: Remove a task
- update_task: Change a task's title or description

IMPORTANT: The user_id for all tool calls is: {user_id}
Always pass this user_id when calling any tool.

Guidelines:
- Be concise and helpful
- Confirm actions after completing them
- If a request is ambiguous, ask for clarification
- If a tool returns an error, explain it in friendly terms
- Only discuss task management topics
"""


async def process_chat_message(
    user_id: str,
    message: str,
    conversation_id: Optional[int],
    session: Session,
) -> dict:
    """Process a chat message: persist, invoke agent, return response.

    Args:
        user_id: UUID string of the authenticated user
        message: The user's chat message
        conversation_id: Optional existing conversation to continue
        session: Database session

    Returns:
        dict matching ChatResponse schema

    Raises:
        ValueError: If conversation not found or ownership mismatch
        RuntimeError: If agent invocation fails
    """
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

    # Step 2: Load message history ordered by created_at ASC
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

    # Step 4: Build agent input from history
    agent_input = []
    for msg in history_messages:
        agent_input.append({"role": msg.role, "content": msg.content})
    # Add current user message
    agent_input.append({"role": "user", "content": message})

    # Step 5-7: Create MCP server, agent, and run
    tool_calls_info = []
    final_response = ""

    # Determine the python executable path and project root
    python_exe = sys.executable
    # The MCP server runs as `python -m backend.src.mcp_server` from the project root
    # Project root is two levels up from this file (services/ -> src/ -> backend/ -> phase3/)
    import pathlib
    project_root = str(pathlib.Path(__file__).resolve().parents[3])

    # Pass necessary env vars to the MCP subprocess
    subprocess_env = {**os.environ}
    subprocess_env["DATABASE_URL"] = settings.DATABASE_URL

    try:
        async with MCPServerStdio(
            name="todo-mcp",
            params={
                "command": python_exe,
                "args": ["-m", "backend.src.mcp_server"],
                "cwd": project_root,
                "env": subprocess_env,
            },
        ) as server:
            agent = Agent(
                name="Todo Assistant",
                instructions=AGENT_SYSTEM_PROMPT.format(user_id=user_id),
                mcp_servers=[server],
            )

            run_config = RunConfig(tracing_disabled=True)
            result = await Runner.run(
                agent,
                input=agent_input,
                run_config=run_config,
            )

            final_response = result.final_output or ""

            # Step 8: Extract tool calls from result.new_items
            pending_call = {}
            for item in result.new_items:
                if isinstance(item, ToolCallItem):
                    raw = item.raw_item
                    call_name = getattr(raw, "name", "unknown")
                    call_args_str = getattr(raw, "arguments", "{}")
                    call_id = getattr(raw, "call_id", None)
                    try:
                        call_args = json.loads(call_args_str) if isinstance(call_args_str, str) else call_args_str
                    except (json.JSONDecodeError, TypeError):
                        call_args = {"raw": str(call_args_str)}
                    pending_call[call_id] = {
                        "tool": call_name,
                        "arguments": call_args,
                    }
                elif isinstance(item, ToolCallOutputItem):
                    raw = item.raw_item
                    call_id = getattr(raw, "call_id", None)
                    output = item.output
                    try:
                        result_data = json.loads(output) if isinstance(output, str) else output
                    except (json.JSONDecodeError, TypeError):
                        result_data = {"raw": str(output)}

                    if call_id and call_id in pending_call:
                        tool_calls_info.append(ToolCallInfo(
                            tool=pending_call[call_id]["tool"],
                            arguments=pending_call[call_id]["arguments"],
                            result=result_data if isinstance(result_data, dict) else {"output": result_data},
                        ))

    except Exception as e:
        logger.exception("Agent invocation failed")
        raise RuntimeError(f"An error occurred processing your message. Please try again.") from e

    # Step 9: Store assistant's message
    assistant_msg = Message(
        conversation_id=conversation.id,
        user_id=user_id,
        role="assistant",
        content=final_response,
    )
    session.add(assistant_msg)

    # Step 10: Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    session.add(conversation)
    session.commit()
    session.refresh(assistant_msg)

    # Step 11: Return response
    return {
        "conversation_id": conversation.id,
        "message_id": assistant_msg.id,
        "response": final_response,
        "tool_calls": [tc.model_dump() for tc in tool_calls_info],
    }
