# Chat API Contract

**Feature**: 004-mcp-server-backend
**Date**: 2026-02-13

## POST /api/chat

### Request

**Headers**:
```
Authorization: Bearer <JWT token>
Content-Type: application/json
```

**Body**:
```json
{
  "message": "string (required, 1-10000 chars)",
  "conversation_id": "integer (optional)"
}
```

**Notes**:
- `user_id` extracted from JWT token (not in request body)
- If `conversation_id` omitted, a new conversation is created
- If `conversation_id` provided, must belong to authenticated user

### Response (200 OK)

```json
{
  "conversation_id": 123,
  "message_id": 456,
  "response": "I've added 'Buy groceries' to your list.",
  "tool_calls": [
    {
      "tool": "add_task",
      "arguments": {
        "user_id": "uuid-string",
        "title": "Buy groceries"
      },
      "result": {
        "success": true,
        "data": {
          "task_id": "uuid-string",
          "title": "Buy groceries",
          "status": "created"
        }
      }
    }
  ]
}
```

**Fields**:
- `conversation_id`: Integer, the conversation this message belongs to
- `message_id`: Integer, the stored assistant message ID
- `response`: String, the agent's natural language response
- `tool_calls`: Array, each tool invocation with name, args, result

### Error Responses

**400 Bad Request** — Missing or invalid message:
```json
{"detail": "Message is required and must be 1-10000 characters"}
```

**401 Unauthorized** — Missing/invalid JWT:
```json
{"detail": "Could not validate credentials"}
```

**403 Forbidden** — Conversation belongs to another user:
```json
{"detail": "Conversation does not belong to the authenticated user"}
```

**404 Not Found** — Invalid conversation_id:
```json
{"detail": "Conversation not found"}
```

**500 Internal Server Error** — Agent or service failure:
```json
{"detail": "An error occurred processing your message. Please try again."}
```
