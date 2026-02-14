"""MCP server exposing 5 task management tools for the AI agent."""

import json
import uuid
from mcp.server.fastmcp import FastMCP
from sqlmodel import Session
from .database import engine
from .models.todo import TodoCreate, TodoUpdate
from .services.todo_service import TodoService

mcp = FastMCP("todo-tools")


def _validate_user_id(user_id: str) -> uuid.UUID:
    """Validate and convert user_id string to UUID."""
    if not user_id or not user_id.strip():
        raise ValueError("user_id is required")
    return uuid.UUID(user_id)


def _validate_task_id(task_id: str) -> uuid.UUID:
    """Validate and convert task_id string to UUID."""
    if not task_id or not task_id.strip():
        raise ValueError("task_id is required")
    return uuid.UUID(task_id)


@mcp.tool()
async def add_task(user_id: str, title: str, description: str = "") -> str:
    """Create a new task for the user.

    Args:
        user_id: UUID of the authenticated user
        title: Task title (1-255 chars)
        description: Optional task description (max 1000 chars)
    """
    try:
        uid = _validate_user_id(user_id)
        if not title or not title.strip():
            return json.dumps({"success": False, "error": "title is required"})

        todo_create = TodoCreate(title=title.strip(), description=description or None)
        with Session(engine) as session:
            todo = TodoService.create_todo(session, todo_create, uid)
            return json.dumps({
                "success": True,
                "data": {
                    "task_id": str(todo.id),
                    "title": todo.title,
                    "status": "created"
                }
            })
    except ValueError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception:
        return json.dumps({"success": False, "error": "Failed to create task"})


@mcp.tool()
async def list_tasks(user_id: str, status: str = "all") -> str:
    """List tasks for the user with optional status filter.

    Args:
        user_id: UUID of the authenticated user
        status: Filter — "all", "pending", or "completed" (default: "all")
    """
    try:
        uid = _validate_user_id(user_id)
        if status not in ("all", "pending", "completed"):
            return json.dumps({"success": False, "error": "Invalid status filter. Use 'all', 'pending', or 'completed'."})

        completed_filter = None
        if status == "pending":
            completed_filter = False
        elif status == "completed":
            completed_filter = True

        with Session(engine) as session:
            todos = TodoService.get_todos(session, uid, completed=completed_filter)
            tasks = [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "description": t.description,
                    "completed": t.completed,
                    "created_at": t.created_at.isoformat() if t.created_at else None
                }
                for t in todos
            ]
            return json.dumps({
                "success": True,
                "data": {
                    "tasks": tasks,
                    "count": len(tasks),
                    "status_filter": status
                }
            })
    except ValueError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception:
        return json.dumps({"success": False, "error": "Failed to list tasks"})


@mcp.tool()
async def complete_task(user_id: str, task_id: str) -> str:
    """Mark a task as completed.

    Args:
        user_id: UUID of the authenticated user
        task_id: UUID of the task to complete
    """
    try:
        uid = _validate_user_id(user_id)
        tid = _validate_task_id(task_id)

        with Session(engine) as session:
            # Check if task exists first
            todo = TodoService.get_todo_by_id(session, tid, uid)
            if not todo:
                return json.dumps({"success": False, "error": "Task not found"})

            if todo.completed:
                return json.dumps({
                    "success": True,
                    "data": {
                        "task_id": str(todo.id),
                        "title": todo.title,
                        "status": "completed",
                        "note": "Task was already completed"
                    }
                })

            # Toggle to completed
            updated = TodoService.toggle_completion(session, tid, uid)
            return json.dumps({
                "success": True,
                "data": {
                    "task_id": str(updated.id),
                    "title": updated.title,
                    "status": "completed"
                }
            })
    except ValueError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception:
        return json.dumps({"success": False, "error": "Failed to complete task"})


@mcp.tool()
async def delete_task(user_id: str, task_id: str) -> str:
    """Delete a task permanently.

    Args:
        user_id: UUID of the authenticated user
        task_id: UUID of the task to delete
    """
    try:
        uid = _validate_user_id(user_id)
        tid = _validate_task_id(task_id)

        with Session(engine) as session:
            # Fetch task first to capture title before deletion
            todo = TodoService.get_todo_by_id(session, tid, uid)
            if not todo:
                return json.dumps({"success": False, "error": "Task not found"})

            title = todo.title
            deleted = TodoService.delete_todo(session, tid, uid)
            if not deleted:
                return json.dumps({"success": False, "error": "Failed to delete task"})

            return json.dumps({
                "success": True,
                "data": {
                    "task_id": str(tid),
                    "title": title,
                    "status": "deleted"
                }
            })
    except ValueError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception:
        return json.dumps({"success": False, "error": "Failed to delete task"})


@mcp.tool()
async def update_task(user_id: str, task_id: str, title: str = "", description: str = "") -> str:
    """Update a task's title or description.

    Args:
        user_id: UUID of the authenticated user
        task_id: UUID of the task to update
        title: New title (optional, 1-255 chars)
        description: New description (optional, max 1000 chars)
    """
    try:
        uid = _validate_user_id(user_id)
        tid = _validate_task_id(task_id)

        if not title.strip() and not description.strip():
            return json.dumps({"success": False, "error": "At least one of title or description required"})

        update_data = {}
        if title.strip():
            update_data["title"] = title.strip()
        if description.strip():
            update_data["description"] = description.strip()

        todo_update = TodoUpdate(**update_data)

        with Session(engine) as session:
            updated = TodoService.update_todo(session, tid, uid, todo_update)
            if not updated:
                return json.dumps({"success": False, "error": "Task not found"})

            return json.dumps({
                "success": True,
                "data": {
                    "task_id": str(updated.id),
                    "title": updated.title,
                    "status": "updated"
                }
            })
    except ValueError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception:
        return json.dumps({"success": False, "error": "Failed to update task"})


if __name__ == "__main__":
    mcp.run()
