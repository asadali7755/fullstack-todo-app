# Quickstart: MCP Server & Backend Integration

**Feature**: 004-mcp-server-backend
**Date**: 2026-02-13

## Prerequisites

- Python 3.11+
- Existing backend running (`backend/src/main.py`)
- Neon PostgreSQL database configured (`.env` with DATABASE_URL)
- OpenAI API key configured

## Setup

### 1. Install New Dependencies

```bash
cd backend
pip install openai-agents mcp
```

Add to `requirements.txt`:
```
openai-agents
mcp
```

### 2. Set Environment Variables

Add to `backend/.env`:
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Create Database Tables

The new Conversation and Message tables are created automatically
via `SQLModel.metadata.create_all(engine)` on server startup (same
pattern as existing User and Todo tables).

### 4. Verify Existing Server Works

```bash
cd backend
python -m uvicorn src.main:app --reload --port 8000
```

Check health: `GET http://localhost:8000/health`

## New Files (to be created during implementation)

```text
backend/src/
├── models/
│   └── conversation.py    # Conversation + Message SQLModel models
├── mcp_server.py          # MCP server with 5 task tools
├── services/
│   └── chat_service.py    # Chat orchestration (agent + persistence)
└── api/
    └── chat_router.py     # POST /api/chat endpoint
```

## Test the Chat Endpoint

```bash
# 1. Get a JWT token (existing auth flow)
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Send a chat message (new conversation)
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add buy groceries to my list"}'

# Expected response:
# {
#   "conversation_id": 1,
#   "message_id": 2,
#   "response": "I've added 'buy groceries' to your list!",
#   "tool_calls": [...]
# }

# 3. Continue the conversation
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show my tasks", "conversation_id": 1}'
```

## Architecture Flow

```text
User → POST /api/chat (JWT auth)
  → chat_router validates auth + loads conversation
  → chat_service builds message history from DB
  → Agent (OpenAI Agents SDK) processes message
    → Agent calls MCP tools as needed
      → MCP tool queries DB via TodoService
      → Returns structured JSON to Agent
  → Agent formulates natural language response
  → chat_service stores messages in DB
  → Response returned with conversation_id + tool_calls
```

## Validation Checklist

- [ ] `POST /api/chat` with valid JWT returns 200
- [ ] New conversation created when conversation_id omitted
- [ ] "Add buy groceries" creates a task in database
- [ ] "Show my tasks" lists only authenticated user's tasks
- [ ] "Mark task X done" completes correct task
- [ ] "Delete task X" removes correct task
- [ ] "Update task X to new title" updates correctly
- [ ] Server restart preserves conversation history
- [ ] Different user cannot see other's tasks
- [ ] Missing JWT returns 401
