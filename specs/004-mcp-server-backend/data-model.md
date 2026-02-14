# Data Model: MCP Server & Backend Integration

**Feature**: 004-mcp-server-backend
**Date**: 2026-02-13

## Existing Entities (No Changes)

### User (table: `users`)

| Field           | Type          | Constraints                    |
|-----------------|---------------|--------------------------------|
| id              | UUID (PK)     | default=uuid4                  |
| email           | str           | unique, indexed                |
| hashed_password | str           | Argon2 hash                    |
| is_active       | bool          | default=True                   |
| created_at      | datetime      | default=utcnow                 |
| updated_at      | datetime      | default=utcnow                 |

**Relationships**: has many Todos, has many Conversations

### Todo (table: `todos`)

| Field       | Type          | Constraints                         |
|-------------|---------------|-------------------------------------|
| id          | UUID (PK)     | default=uuid4                       |
| user_id     | UUID (FK)     | → users.id, indexed, not null       |
| title       | str           | 1-255 chars, required               |
| description | str (opt)     | max 1000 chars                      |
| completed   | bool          | default=False, indexed              |
| created_at  | datetime      | default=utcnow                      |
| updated_at  | datetime      | default=utcnow                      |

**Relationships**: belongs to User

## New Entities

### Conversation (table: `conversations`)

| Field      | Type          | Constraints                         |
|------------|---------------|-------------------------------------|
| id         | Integer (PK)  | auto-increment                      |
| user_id    | str           | indexed, not null                   |
| created_at | datetime      | default=utcnow, not null            |
| updated_at | datetime      | default=utcnow, not null            |

**Relationships**: has many Messages
**Validation**: user_id must be a valid UUID string
**Indexes**: user_id (for listing user's conversations)

### Message (table: `messages`)

| Field           | Type          | Constraints                    |
|-----------------|---------------|--------------------------------|
| id              | Integer (PK)  | auto-increment                 |
| conversation_id | Integer (FK)  | → conversations.id, indexed    |
| user_id         | str           | indexed, not null              |
| role            | str           | 'user' or 'assistant', not null|
| content         | Text          | not null                       |
| created_at      | datetime      | default=utcnow, not null       |

**Relationships**: belongs to Conversation
**Validation**:
- role MUST be one of: 'user', 'assistant'
- user_id MUST match parent Conversation.user_id
- content MUST not be empty

**Indexes**:
- conversation_id (for loading conversation history)
- user_id (for user isolation queries)
- (conversation_id, created_at) composite for ordered loading

## Entity Relationship Diagram

```text
User (existing)
 ├── 1:N → Todo (existing)
 └── 1:N → Conversation (new)
                └── 1:N → Message (new)
```

## SQLModel Implementation Notes

- Conversation and Message use Integer PKs (auto-increment) per
  research decision, not UUIDs.
- user_id stored as `str` in new models (representing UUID string)
  to avoid tight coupling with the User model's UUID type.
- Messages ordered by `created_at ASC` within a conversation.
- No cascade delete configured — conversations persist even if
  user is deactivated (data retention).

## MCP Tool Response Schemas

All tools return JSON strings. Consistent structure:

### Success Response
```json
{
  "success": true,
  "data": { /* tool-specific fields */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Tool-Specific Data Fields

**add_task**:
```json
{"task_id": "uuid-string", "title": "Buy groceries", "status": "created"}
```

**list_tasks**:
```json
{
  "tasks": [
    {"id": "uuid", "title": "...", "completed": false, "created_at": "ISO"}
  ],
  "count": 3,
  "status_filter": "all"
}
```

**complete_task**:
```json
{"task_id": "uuid", "title": "Call mom", "status": "completed"}
```

**delete_task**:
```json
{"task_id": "uuid", "title": "Old task", "status": "deleted"}
```

**update_task**:
```json
{"task_id": "uuid", "title": "Updated title", "status": "updated"}
```
