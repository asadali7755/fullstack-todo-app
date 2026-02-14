# Implementation Plan: MCP Server & Backend Integration

**Branch**: `004-mcp-server-backend` | **Date**: 2026-02-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-mcp-server-backend/spec.md`

## Summary

Add conversational AI capabilities to the existing Todo app by
creating an MCP server exposing 5 task operation tools, integrating
the OpenAI Agents SDK for natural language understanding, adding
a stateless chat endpoint (`POST /api/chat`), and persisting
conversation state in new Conversation/Message database models.
The agent interacts with task data exclusively through MCP tools,
and all conversation history is loaded from the database on every
request (no in-memory state).

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI 0.104+, SQLModel 0.0.32+, openai-agents, mcp (FastMCP)
**Storage**: Neon Serverless PostgreSQL (existing, extend with conversations + messages tables)
**Testing**: pytest (manual + endpoint testing)
**Target Platform**: Linux server (HuggingFace Spaces deployment)
**Project Type**: Web application (backend extension — no frontend changes in this spec)
**Performance Goals**: < 5s response time per chat message under normal conditions
**Constraints**: Stateless server (all state in DB), MCP-only agent-DB interface
**Scale/Scope**: Single-user demo focus; hackathon evaluation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. User Isolation & Security | PASS | Every MCP tool requires user_id parameter; queries filter by user_id; chat endpoint extracts user from JWT |
| II. MCP-Only Agent-DB Interface | PASS | Agent connects to MCP server via MCPServerStdio; 5 tools are sole DB gateway; no direct queries from agent |
| III. Stateless Server, Persistent State | PASS | Conversation + Message models persist all state; history loaded from DB each request; no in-memory caching |
| IV. Spec-Driven Traceability | PASS | Spec → Plan → Tasks pipeline followed; PHRs document all prompts; tool_calls in response enable tracing |
| V. Structured Contracts & Typed Boundaries | PASS | MCP tools return consistent JSON (`success`/`data`/`error`); Pydantic validates chat request; typed SQLModel schemas |
| VI. Separation of Concerns | PASS | Chat router → Chat service → Agent → MCP Server → TodoService → DB; each layer has clear interface |

**Post-design re-check**: All gates still PASS after Phase 1 design.

## Project Structure

### Documentation (this feature)

```text
specs/004-mcp-server-backend/
├── plan.md                        # This file
├── spec.md                        # Feature specification
├── research.md                    # Technology research & decisions
├── data-model.md                  # Conversation + Message schemas
├── quickstart.md                  # Setup and testing guide
├── contracts/
│   ├── chat-api-contract.md       # POST /api/chat contract
│   └── mcp-tools-contract.md      # 5 MCP tool contracts
└── checklists/
    └── requirements.md            # Spec quality checklist
```

### Source Code (backend only — this feature)

```text
backend/
├── src/
│   ├── main.py                    # MODIFY: register chat_router
│   ├── models/
│   │   ├── user.py                # EXISTING (no changes)
│   │   ├── todo.py                # EXISTING (no changes)
│   │   └── conversation.py        # NEW: Conversation + Message models
│   ├── services/
│   │   ├── todo_service.py        # EXISTING (no changes)
│   │   └── chat_service.py        # NEW: agent orchestration + persistence
│   ├── api/
│   │   ├── auth_router.py         # EXISTING (no changes)
│   │   ├── todo_router.py         # EXISTING (no changes)
│   │   ├── auth_dependencies.py   # EXISTING (reused by chat_router)
│   │   └── chat_router.py         # NEW: POST /api/chat endpoint
│   ├── mcp_server.py              # NEW: MCP server with 5 tools
│   └── config.py                  # MODIFY: add OPENAI_API_KEY setting
├── requirements.txt               # MODIFY: add openai-agents, mcp
└── .env                           # MODIFY: add OPENAI_API_KEY
```

**Structure Decision**: Extending the existing web application backend.
Only backend changes — no frontend in this spec (Part 2). New files
follow existing patterns (models/, services/, api/ directories).

## Key Decisions

| Decision | Choice | Rationale | Ref |
|----------|--------|-----------|-----|
| MCP tool style | Standalone functions | Simpler for 5 tools; minimal shared code | research.md §3 |
| History loading | Full history per request | Short conversations in demo; complete context needed | research.md §4 |
| Error handling | Immediate return | Fast feedback; no retry latency | research.md §5 |
| Conversation IDs | Auto-increment integer | Simpler than UUID for demo; readable in logs | research.md §6 |
| Tool call logging | In response JSON | Frontend needs it; no extra DB writes | research.md §7 |
| MCP transport | stdio (MCPServerStdio) | Simplest integration; no HTTP server needed | research.md §8 |
| user_id passing | String param per tool | Agent injects from system prompt context | research.md §9 |

## Architecture

### Request Flow

```text
┌─────────┐     POST /api/chat     ┌──────────────┐
│ Frontend │ ──────────────────────→│ chat_router   │
│ (ChatKit)│     (JWT + message)    │ (FastAPI)     │
└─────────┘                        └──────┬───────┘
                                          │
                              1. Validate JWT (get_current_user)
                              2. Validate request body
                              3. Fetch/create Conversation
                                          │
                                   ┌──────▼───────┐
                                   │ chat_service  │
                                   └──────┬───────┘
                                          │
                              4. Load Message history from DB
                              5. Store user Message
                              6. Build agent input
                                          │
                           ┌──────────────▼──────────────┐
                           │  OpenAI Agent (Agents SDK)   │
                           │  - System prompt             │
                           │  - Conversation history      │
                           │  - MCP tools available       │
                           └──────────────┬──────────────┘
                                          │
                              7. Agent reasons + calls tools
                                          │
                           ┌──────────────▼──────────────┐
                           │  MCP Server (FastMCP/stdio)  │
                           │  - add_task                  │
                           │  - list_tasks                │
                           │  - complete_task             │
                           │  - delete_task               │
                           │  - update_task               │
                           └──────────────┬──────────────┘
                                          │
                              8. MCP tools use TodoService
                                          │
                           ┌──────────────▼──────────────┐
                           │  TodoService (existing)      │
                           │  → Neon PostgreSQL           │
                           └──────────────┬──────────────┘
                                          │
                              9. Tool returns structured JSON
                             10. Agent formulates response
                                          │
                                   ┌──────▼───────┐
                                   │ chat_service  │
                                   └──────┬───────┘
                                          │
                             11. Store assistant Message
                             12. Build response with tool_calls
                                          │
                                   ┌──────▼───────┐
                                   │ chat_router   │
                                   └──────┬───────┘
                                          │
                             13. Return JSON response
                                          │
                                   ┌──────▼───────┐
                                   │   Frontend    │
                                   └──────────────┘
```

### Agent System Prompt

```text
You are a task management assistant. You help users manage their
todo list through natural language conversation.

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
```

### User Isolation Points

```text
1. chat_router: JWT → get_current_user → user.id (UUID)
2. chat_service: Conversation.user_id == str(user.id)
3. Agent system prompt: user_id injected, cannot be changed by user
4. MCP tool: user_id param → UUID conversion → TodoService query filter
5. TodoService: WHERE user_id == ? on every query
```

## Implementation Phases

### Phase 1: Database Models (Foundation)
- Create `backend/src/models/conversation.py`
  - Conversation model (id, user_id, created_at, updated_at)
  - Message model (id, conversation_id, user_id, role, content, created_at)
  - Pydantic schemas: ChatRequest, ChatResponse, ToolCallInfo
- Import models in `main.py` so tables are created on startup
- **Validates**: FR-004, FR-006, FR-008

### Phase 2: MCP Server + Tools (Core)
- Create `backend/src/mcp_server.py`
  - FastMCP instance with 5 `@mcp.tool()` functions
  - Each tool: validate user_id → call TodoService → return JSON
  - Tools: add_task, list_tasks, complete_task, delete_task, update_task
- **Validates**: FR-002, FR-003, FR-009 through FR-014

### Phase 3: Chat Service (Orchestration)
- Create `backend/src/services/chat_service.py`
  - `process_chat_message(user_id, message, conversation_id?)`
  - Conversation fetch/create with ownership check
  - Message history loading (ordered by created_at)
  - User message storage
  - Agent invocation with MCP tools
  - Assistant message storage
  - Tool call extraction from agent result
- **Validates**: FR-001, FR-005, FR-006, FR-007

### Phase 4: Chat API Endpoint (Interface)
- Create `backend/src/api/chat_router.py`
  - `POST /api/chat` with auth dependency
  - Request validation (message required, 1-10000 chars)
  - Delegates to chat_service
  - Error handling (400, 401, 403, 404, 500)
- Modify `backend/src/main.py` to register chat_router
- Modify `backend/src/config.py` to add OPENAI_API_KEY
- Update `backend/requirements.txt` with new dependencies
- **Validates**: FR-008, FR-015

### Phase 5: End-to-End Integration
- Test complete flow with curl/httpie
- Verify all 5 MCP tools work through chat
- Verify conversation persistence across requests
- Verify user isolation (different JWTs)
- Verify error handling for edge cases
- **Validates**: SC-001 through SC-008

## Complexity Tracking

No constitution violations. All design decisions align with the
6 principles. No complexity justification needed.
