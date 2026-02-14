# MCP Tools Contract

**Feature**: 004-mcp-server-backend
**Date**: 2026-02-13

All tools are registered on the MCP server and invoked by the
OpenAI agent via `MCPServerStdio`. Each tool receives parameters
as JSON and returns a JSON string.

## Tool 1: add_task

**Description**: Create a new task for the authenticated user.

**Parameters**:
| Name        | Type   | Required | Description              |
|-------------|--------|----------|--------------------------|
| user_id     | string | yes      | UUID of authenticated user |
| title       | string | yes      | Task title (1-255 chars) |
| description | string | no       | Task description (max 1000) |

**Success Response**:
```json
{
  "success": true,
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "status": "created"
  }
}
```

**Error Responses**:
- Missing user_id: `{"success": false, "error": "user_id is required"}`
- Missing title: `{"success": false, "error": "title is required"}`
- DB error: `{"success": false, "error": "Failed to create task"}`

---

## Tool 2: list_tasks

**Description**: List tasks for the authenticated user with
optional status filter.

**Parameters**:
| Name    | Type   | Required | Description                        |
|---------|--------|----------|------------------------------------|
| user_id | string | yes      | UUID of authenticated user         |
| status  | string | no       | "all", "pending", "completed" (default: "all") |

**Success Response**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "550e8400-...",
        "title": "Buy groceries",
        "description": null,
        "completed": false,
        "created_at": "2026-02-13T10:00:00Z"
      }
    ],
    "count": 1,
    "status_filter": "all"
  }
}
```

**Error Responses**:
- Missing user_id: `{"success": false, "error": "user_id is required"}`
- Invalid status: `{"success": false, "error": "Invalid status filter"}`

---

## Tool 3: complete_task

**Description**: Mark a task as completed.

**Parameters**:
| Name    | Type   | Required | Description                |
|---------|--------|----------|----------------------------|
| user_id | string | yes      | UUID of authenticated user |
| task_id | string | yes      | UUID of the task           |

**Success Response**:
```json
{
  "success": true,
  "data": {
    "task_id": "550e8400-...",
    "title": "Call mom",
    "status": "completed"
  }
}
```

**Error Responses**:
- Missing user_id: `{"success": false, "error": "user_id is required"}`
- Missing task_id: `{"success": false, "error": "task_id is required"}`
- Not found: `{"success": false, "error": "Task not found"}`

---

## Tool 4: delete_task

**Description**: Delete a task permanently.

**Parameters**:
| Name    | Type   | Required | Description                |
|---------|--------|----------|----------------------------|
| user_id | string | yes      | UUID of authenticated user |
| task_id | string | yes      | UUID of the task           |

**Success Response**:
```json
{
  "success": true,
  "data": {
    "task_id": "550e8400-...",
    "title": "Old task",
    "status": "deleted"
  }
}
```

**Error Responses**:
- Missing user_id: `{"success": false, "error": "user_id is required"}`
- Missing task_id: `{"success": false, "error": "task_id is required"}`
- Not found: `{"success": false, "error": "Task not found"}`

---

## Tool 5: update_task

**Description**: Update a task's title or description.

**Parameters**:
| Name        | Type   | Required | Description                |
|-------------|--------|----------|----------------------------|
| user_id     | string | yes      | UUID of authenticated user |
| task_id     | string | yes      | UUID of the task           |
| title       | string | no       | New title (1-255 chars)    |
| description | string | no       | New description (max 1000) |

**Note**: At least one of `title` or `description` must be provided.

**Success Response**:
```json
{
  "success": true,
  "data": {
    "task_id": "550e8400-...",
    "title": "Buy groceries and fruits",
    "status": "updated"
  }
}
```

**Error Responses**:
- Missing user_id: `{"success": false, "error": "user_id is required"}`
- Missing task_id: `{"success": false, "error": "task_id is required"}`
- No fields: `{"success": false, "error": "At least one of title or description required"}`
- Not found: `{"success": false, "error": "Task not found"}`
