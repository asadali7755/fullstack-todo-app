# Tasks: MCP Server & Backend Integration

**Input**: Design documents from `/specs/004-mcp-server-backend/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the spec. Tests are omitted.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/` for all source files
- Existing files: `backend/src/models/todo.py`, `backend/src/services/todo_service.py`, `backend/src/api/auth_dependencies.py`
- New files follow same directory conventions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment for new features

- [x] T001 Add `openai-agents` and `mcp` to `backend/requirements.txt` and install them
- [x] T002 Add `OPENAI_API_KEY` setting to `backend/src/config.py` (follow existing `Settings` class pattern with `os.getenv`)
- [x] T003 Add `OPENAI_API_KEY=sk-placeholder` to `backend/.env.example` and document in `backend/.env`

**Checkpoint**: Dependencies installed and config ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database models and MCP server that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create Conversation and Message SQLModel models in `backend/src/models/conversation.py`
  - Conversation: id (Integer PK auto-increment), user_id (str, indexed), created_at, updated_at
  - Message: id (Integer PK auto-increment), conversation_id (Integer FK → conversations.id, indexed), user_id (str, indexed), role (str: 'user'|'assistant'), content (Text), created_at
  - ChatRequest Pydantic schema: message (str, 1-10000), conversation_id (Optional[int])
  - ChatResponse Pydantic schema: conversation_id (int), message_id (int), response (str), tool_calls (list)
  - ToolCallInfo Pydantic schema: tool (str), arguments (dict), result (dict)

- [x] T005 Import Conversation and Message models in `backend/src/main.py` so tables are auto-created on startup (add `from .models.conversation import Conversation, Message` alongside existing model imports)

- [x] T006 Create MCP server with `add_task` tool in `backend/src/mcp_server.py`
  - Create `FastMCP("todo-tools")` instance
  - Implement `add_task(user_id: str, title: str, description: str = "") -> str`
  - Validate user_id (non-empty, valid UUID format)
  - Use TodoService.create_todo() with DB session from engine
  - Return JSON: `{"success": true, "data": {"task_id": "...", "title": "...", "status": "created"}}`
  - On error return: `{"success": false, "error": "..."}`

- [x] T007 Add `list_tasks` tool to `backend/src/mcp_server.py`
  - Implement `list_tasks(user_id: str, status: str = "all") -> str`
  - Validate user_id and status ("all", "pending", "completed")
  - Use TodoService.get_todos() with completed filter mapping
  - Return JSON with tasks array, count, and status_filter per mcp-tools-contract.md

- [x] T008 Add `complete_task` tool to `backend/src/mcp_server.py`
  - Implement `complete_task(user_id: str, task_id: str) -> str`
  - Validate user_id and task_id (valid UUID strings)
  - Use TodoService.toggle_completion() (note: existing method toggles, so check if already completed)
  - Return JSON with task_id, title, status="completed"
  - Return `{"success": false, "error": "Task not found"}` if not found

- [x] T009 Add `delete_task` tool to `backend/src/mcp_server.py`
  - Implement `delete_task(user_id: str, task_id: str) -> str`
  - Validate user_id and task_id
  - Fetch task first via TodoService.get_todo_by_id() to capture title before deletion
  - Use TodoService.delete_todo()
  - Return JSON with task_id, title, status="deleted"

- [x] T010 Add `update_task` tool to `backend/src/mcp_server.py`
  - Implement `update_task(user_id: str, task_id: str, title: str = "", description: str = "") -> str`
  - Validate at least one of title/description is non-empty
  - Use TodoService.update_todo() with TodoUpdate model
  - Return JSON with task_id, updated title, status="updated"

- [x] T011 Add `if __name__ == "__main__": mcp.run()` entry point to `backend/src/mcp_server.py` so it can be launched as stdio subprocess

**Checkpoint**: Foundation ready — DB models created, all 5 MCP tools working as standalone functions. User story implementation can now begin.

---

## Phase 3: User Story 1 — Natural Language Task Management (Priority: P1) MVP

**Goal**: User sends natural language messages and the agent invokes the correct MCP tools to manage tasks

**Independent Test**: `POST /api/chat` with "Add buy groceries" → response confirms task creation; "Show my tasks" → response lists tasks

### Implementation for User Story 1

- [x] T012 [US1] Create chat service in `backend/src/services/chat_service.py`
  - Implement `async process_chat_message(user_id: str, message: str, conversation_id: Optional[int], session: Session) -> dict`
  - Step 1: Fetch or create Conversation (validate user_id ownership if conversation_id provided)
  - Step 2: Load all Message records for the conversation ordered by created_at ASC
  - Step 3: Store user's Message (role='user', content=message)
  - Step 4: Build agent input from history (list of {"role": ..., "content": ...} dicts)
  - Step 5: Create MCPServerStdio context for `python -m backend.src.mcp_server`
  - Step 6: Create Agent with system prompt (inject user_id), mcp_servers=[server]
  - Step 7: Run agent with `await Runner.run(agent, agent_input)`
  - Step 8: Extract tool calls from result.new_items (ToolCallItem, ToolCallOutputItem)
  - Step 9: Store assistant's Message (role='assistant', content=result.final_output)
  - Step 10: Update Conversation.updated_at
  - Step 11: Return ChatResponse dict with conversation_id, message_id, response, tool_calls

- [x] T013 [US1] Create chat router in `backend/src/api/chat_router.py`
  - Create `router = APIRouter(tags=["chat"])`
  - Implement `POST /` endpoint accepting ChatRequest body
  - Use `get_current_user` dependency for JWT auth (reuse from auth_dependencies.py)
  - Use `get_session` dependency for DB session
  - Validate message length (1-10000 chars, return 400 if invalid)
  - Call chat_service.process_chat_message()
  - Handle errors: 403 (wrong user's conversation), 404 (conversation not found), 500 (agent failure)
  - Return ChatResponse

- [x] T014 [US1] Register chat router in `backend/src/main.py`
  - Add `from .api.chat_router import router as chat_router`
  - Add `app.include_router(chat_router, prefix="/api/chat", tags=["chat"])`

- [ ] T015 [US1] Verify end-to-end: authenticate, send "Add buy groceries", confirm task created in DB and response contains tool_calls with add_task

**Checkpoint**: User Story 1 functional — users can manage tasks through natural language chat. This is the MVP.

---

## Phase 4: User Story 2 — Conversation Persistence (Priority: P2)

**Goal**: Conversation history persists across browser sessions and server restarts; agent responses are context-aware

**Independent Test**: Send 3 messages, note conversation_id; send a 4th message with same conversation_id; verify response references earlier context

### Implementation for User Story 2

- [ ] T016 [US2] Verify conversation persistence in chat_service already handles multi-turn: send message 1, get conversation_id, send message 2 with same conversation_id, verify Message table has both user + assistant records and agent response is context-aware

- [ ] T017 [US2] Verify server restart persistence: stop uvicorn, restart it, send a message with an existing conversation_id, verify full history is loaded from DB and agent responds with context

- [ ] T018 [US2] Verify new conversation auto-creation: send a message with no conversation_id, verify a new Conversation record is created and returned in response

**Checkpoint**: Conversation persistence verified — messages survive browser close and server restart

---

## Phase 5: User Story 3 — User Isolation in Chat (Priority: P1)

**Goal**: User A's tasks and conversations are invisible to User B

**Independent Test**: Create task as User A via chat, query tasks as User B via chat, verify zero cross-contamination

### Implementation for User Story 3

- [ ] T019 [US3] Verify MCP tool isolation: authenticate as User A, add task via chat; authenticate as User B, send "Show my tasks" via chat; verify User B sees 0 tasks

- [ ] T020 [US3] Verify conversation isolation: User A's conversation_id sent by User B returns 403 Forbidden (chat_service ownership check)

- [ ] T021 [US3] Verify unauthenticated access: send POST /api/chat without JWT header, verify 401 Unauthorized

**Checkpoint**: User isolation confirmed — no cross-user data leakage through chat

---

## Phase 6: User Story 4 — Graceful Error Handling (Priority: P2)

**Goal**: Ambiguous, invalid, or failing requests produce helpful user-facing messages

**Independent Test**: Send "Do something weird", verify chatbot asks for clarification; send empty message, verify 400 error

### Implementation for User Story 4

- [x] T022 [US4] Add input validation to chat router in `backend/src/api/chat_router.py`
  - Validate message is not empty and not over 10000 chars (return 400 with clear message)
  - Validate conversation_id is positive integer if provided

- [x] T023 [US4] Add try/except error handling around agent invocation in `backend/src/services/chat_service.py`
  - Catch agent/MCP exceptions → return 500 with "An error occurred processing your message. Please try again."
  - Catch conversation not found → return appropriate error dict
  - Catch conversation ownership mismatch → return 403 error dict
  - Log full exception details via logger for debugging

- [ ] T024 [US4] Verify agent handles ambiguous input: send "Do the thing" → agent asks for clarification (handled by agent system prompt, no code change needed)

- [ ] T025 [US4] Verify agent handles tool errors gracefully: attempt to complete a non-existent task_id → agent communicates "I couldn't find that task" in natural language

**Checkpoint**: All error paths produce user-friendly responses — no stack traces or raw errors exposed

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T026 Verify all 5 MCP tools work end-to-end through chat: add, list (all/pending/completed), complete, delete, update
- [ ] T027 Verify tool_calls array in response contains correct tool name, arguments, and result for each invocation
- [ ] T028 Run quickstart.md validation checklist from `specs/004-mcp-server-backend/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (Phase 3) must complete before US2/US3/US4 can be verified
  - US2, US3, US4 (Phases 4-6) can proceed after US1 is working
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — this IS the MVP
- **User Story 2 (P2)**: Depends on US1 being functional (needs working chat to test persistence)
- **User Story 3 (P1)**: Depends on US1 being functional (needs working chat to test isolation)
- **User Story 4 (P2)**: Partly parallel with US1 (T022-T023 can be built during US1), verification depends on US1

### Within Each Phase

- Setup: T001 → T002 → T003 (sequential, same config area)
- Foundational: T004 → T005 (models first, then import); T006-T011 can be done sequentially after T004-T005
- US1: T012 → T013 → T014 → T015 (sequential: service → router → registration → verify)
- US2: T016, T017, T018 (verification tasks, sequential)
- US3: T019, T020, T021 (verification tasks, sequential)
- US4: T022 + T023 (can parallel, different files) → T024, T025 (verification)

### Parallel Opportunities

```text
# Phase 2 — after T004-T005 complete:
T006, T007, T008, T009, T010 can be written in one file sequentially
(same file backend/src/mcp_server.py — not parallelizable)

# Phase 6 — T022 and T023 can run in parallel:
Task: "Add input validation in backend/src/api/chat_router.py"
Task: "Add error handling in backend/src/services/chat_service.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T011) — models + all 5 MCP tools
3. Complete Phase 3: User Story 1 (T012-T015) — chat service + router + integration
4. **STOP and VALIDATE**: Test "Add buy groceries" and "Show my tasks" end-to-end
5. Deploy/demo if ready — this is the hackathon MVP

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. User Story 1 → Natural language task management works (MVP!)
3. User Story 3 → User isolation verified (critical security)
4. User Story 2 → Conversation persistence verified
5. User Story 4 → Error handling polished
6. Polish → All tools verified, quickstart validated

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All MCP tools are in ONE file (backend/src/mcp_server.py) — tasks T006-T010 are sequential, not parallel
- US2/US3/US4 are primarily verification phases since the core implementation is in Foundational + US1
