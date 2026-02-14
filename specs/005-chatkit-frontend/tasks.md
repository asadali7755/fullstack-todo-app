# Tasks: ChatKit Frontend

**Input**: Design documents from `/specs/005-chatkit-frontend/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested. Tests omitted.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/` for all source files
- Existing files: `frontend/app/dashboard/layout.tsx`, `frontend/lib/api-client.ts`, `frontend/types/index.ts`
- New files follow same directory conventions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create TypeScript types and API client module used by all user stories

- [x] T001 Create chat TypeScript types in `frontend/types/chat.ts`
  - ChatMessage interface: id (string), role ('user' | 'assistant'), content (string), toolCalls (ToolCallDisplay[]), timestamp (Date), isError (boolean)
  - ToolCallDisplay interface: tool (string), arguments (Record<string, unknown>), result ({ success, data?, error? })
  - ChatApiRequest interface: message (string), conversation_id (number optional)
  - ChatApiResponse interface: conversation_id (number), message_id (number), response (string), tool_calls (ToolCallDisplay[])
  - ChatApiError interface: detail (string)

- [x] T002 Create chat API client module in `frontend/lib/chat-api.ts`
  - Import apiClient from `frontend/lib/api-client.ts`
  - Implement `sendChatMessage(message: string, conversationId?: number): Promise<ChatApiResponse>`
  - POST to `/api/chat/` with `{ message, conversation_id: conversationId }`
  - Map error responses to user-friendly messages per contracts/chat-api-client-contract.md
  - Handle 401 (clear token, redirect), 403 (clear conversation_id), 404 (clear conversation_id), 500 (friendly message), network error

**Checkpoint**: Types and API client ready — component development can begin

---

## Phase 2: Foundational (Route + Navigation)

**Purpose**: Create the /chat route and add navigation — BLOCKS all UI component work

- [x] T003 Create chat layout in `frontend/app/chat/layout.tsx`
  - 'use client' directive
  - Auth check using `useAuth()` hook (same pattern as `frontend/app/dashboard/layout.tsx`)
  - Redirect to `/sign-in` if not authenticated
  - Sidebar with same nav items as dashboard + "AI Assistant" active state
  - Full-height layout structure for chat (no TodoProvider wrapper)
  - Support light/dark theme via existing ThemeProvider

- [x] T004 Create minimal chat page in `frontend/app/chat/page.tsx`
  - 'use client' directive
  - Placeholder content: "AI Assistant" heading + "Chat coming soon" message
  - Will be fully implemented in Phase 3

- [x] T005 Add "AI Assistant" nav item to `frontend/app/dashboard/layout.tsx`
  - Import `MessageSquare` icon from lucide-react
  - Add `{ href: '/chat', label: 'AI Assistant', icon: MessageSquare }` to navItems array
  - Verify active state works for `/chat` route (pathname check)

**Checkpoint**: /chat route accessible, auth-protected, linked from dashboard sidebar

---

## Phase 3: User Story 1 — Chat Page with Message Exchange (Priority: P1) MVP

**Goal**: User sends messages and receives AI assistant responses with tool call badges

**Independent Test**: Navigate to /chat, type "Add buy groceries", verify assistant response with tool badge appears

### Implementation for User Story 1

- [x] T006 [P] [US1] Create ToolCallBadge component in `frontend/components/chat/ToolCallBadge.tsx`
  - Accept `ToolCallDisplay` props
  - Render pill/badge with tool name (e.g., "add_task")
  - Green styling for success (`bg-green-500/10 text-green-600`), red for error
  - Show brief result summary (e.g., "Created: Buy groceries")

- [x] T007 [P] [US1] Create ChatMessage component in `frontend/components/chat/ChatMessage.tsx`
  - Accept `ChatMessage` type props
  - User messages: right-aligned, indigo accent (`bg-indigo-500/10`), user initial avatar
  - Assistant messages: left-aligned, glass background (`bg-glass`), bot icon
  - Error messages: red accent styling with error icon
  - Render ToolCallBadge for each toolCall in assistant messages
  - Display timestamp

- [x] T008 [P] [US1] Create ChatInput component in `frontend/components/chat/ChatInput.tsx`
  - Text input with send button (Send icon from lucide-react)
  - Submit on Enter key (Shift+Enter for newline)
  - Disable when `isLoading` prop is true
  - Validate: non-empty, ≤10000 characters
  - Show character count when approaching limit (>9000 chars)
  - Clear input after send
  - Auto-focus on mount and after response

- [x] T009 [US1] Create ChatInterface component in `frontend/components/chat/ChatInterface.tsx`
  - Accept messages[], isLoading, onSendMessage props
  - Scrollable message area with auto-scroll to bottom (useRef + scrollIntoView)
  - Empty state: welcome message with suggested prompts (e.g., "Try: Add buy groceries")
  - Render ChatMessage for each message
  - Show loading indicator (pulsing dots) when isLoading
  - Render ChatInput at bottom (sticky)

- [x] T010 [US1] Implement full chat page in `frontend/app/chat/page.tsx`
  - State: messages (ChatMessage[]), conversationId (number|null), isLoading (boolean), input (string)
  - handleSendMessage function:
    1. Validate message
    2. Append user ChatMessage to messages[]
    3. Set isLoading=true
    4. Call sendChatMessage(message, conversationId)
    5. On success: store conversationId, append assistant ChatMessage with toolCalls
    6. On error: append error ChatMessage with friendly message
    7. Set isLoading=false
  - Render ChatInterface with messages, isLoading, onSendMessage

**Checkpoint**: User Story 1 functional — users can send messages, see responses, and view tool call badges. This is the MVP.

---

## Phase 4: User Story 2 — Conversation Persistence (Priority: P2)

**Goal**: Conversation continues seamlessly across page refreshes

**Independent Test**: Send 3 messages, refresh page, verify conversation_id is preserved and next message continues the conversation

### Implementation for User Story 2

- [x] T011 [US2] Add localStorage persistence to chat page in `frontend/app/chat/page.tsx`
  - On mount: read `chat_conversation_id` from localStorage → set conversationId state
  - On successful API response: save `chat_conversation_id` to localStorage
  - On 403/404 error: clear `chat_conversation_id` from localStorage, reset conversationId state

- [x] T012 [US2] Add empty state for returning users in `frontend/components/chat/ChatInterface.tsx`
  - When conversationId exists but messages[] is empty (page refresh): show "Continue your conversation..." prompt instead of welcome message
  - First message sent with existing conversationId continues the conversation on backend

**Checkpoint**: Conversation persists across refreshes — conversation_id remembered, backend maintains full history

---

## Phase 5: User Story 3 — Authenticated API Integration (Priority: P1)

**Goal**: All requests are authenticated; unauthenticated users cannot access chat

**Independent Test**: Open /chat without logging in → redirected to sign-in. Log in → chat works with JWT

### Implementation for User Story 3

- [x] T013 [US3] Verify auth redirect in chat layout `frontend/app/chat/layout.tsx`
  - Confirm useAuth() + redirect pattern matches dashboard layout exactly
  - Show LoadingSpinner while auth is checking (no flash of chat content)
  - Return null if not authenticated (before redirect completes)

- [x] T014 [US3] Handle 401 error in chat API client `frontend/lib/chat-api.ts`
  - On 401: clear `access_token` from localStorage
  - Redirect user to `/sign-in` via `window.location.href = '/sign-in'`

- [x] T015 [US3] Clear chat state on sign-out
  - In chat layout or page: when user signs out, clear `chat_conversation_id` from localStorage
  - Ensure no stale conversation_id persists for next user

**Checkpoint**: Auth fully integrated — protected route, JWT on requests, graceful 401 handling

---

## Phase 6: User Story 4 — Loading States and Error Handling (Priority: P2)

**Goal**: Clear loading indicators and friendly error messages for all failure scenarios

**Independent Test**: Send a message → verify loading indicator. Disconnect network → verify friendly error

### Implementation for User Story 4

- [x] T016 [US4] Create loading indicator in `frontend/components/chat/ChatInterface.tsx`
  - Pulsing dots animation below the last message while isLoading is true
  - Use CSS animation (Tailwind `animate-pulse` or custom keyframes)
  - Positioned as if it's an incoming assistant message

- [x] T017 [US4] Map all error types to friendly messages in `frontend/app/chat/page.tsx`
  - 400: "Your message couldn't be sent. Please check and try again."
  - 401: "Your session has expired. Please sign in again."
  - 403: "This conversation is no longer available. Starting fresh."
  - 500: "Something went wrong. Please try again."
  - Network error: "Unable to reach the server. Check your connection."
  - Display as error ChatMessage (isError=true) in the conversation

- [x] T018 [US4] Disable input during processing in `frontend/components/chat/ChatInput.tsx`
  - When isLoading=true: disable textarea and send button
  - When isLoading=false: re-enable and auto-focus textarea
  - Prevent double-submit on rapid Enter presses

**Checkpoint**: All error paths produce friendly messages — no raw errors, clear loading states

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Theme support, responsive design, and end-to-end validation

- [x] T019 Verify light and dark theme rendering in all chat components
  - Test ToolCallBadge, ChatMessage, ChatInput, ChatInterface in both themes
  - Ensure CSS variables from globals.css are used (not hardcoded colors)

- [x] T020 Verify responsive layout on mobile (sidebar collapse, full-width chat)
  - Test chat layout sidebar toggle on small screens
  - Ensure chat input is visible and usable on mobile

- [x] T021 Run quickstart.md validation checklist from `specs/005-chatkit-frontend/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (types needed for layout)
- **User Stories (Phase 3+)**: All depend on Phase 2 completion
  - US1 (Phase 3) must complete before US2/US4 can be fully verified
  - US3 (Phase 5) can proceed in parallel with US1 (different concerns)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — this IS the MVP
- **User Story 2 (P2)**: Depends on US1 (needs working chat to test persistence)
- **User Story 3 (P1)**: Can proceed in parallel with US1 (auth is in layout, not page)
- **User Story 4 (P2)**: Partly parallel with US1 (loading indicator built with US1); error mapping depends on US1

### Within Each Phase

- Phase 1: T001 → T002 (types before API client)
- Phase 2: T003, T004, T005 sequential (layout → page → nav)
- US1: T006, T007, T008 can parallel [P] (different files) → T009 (depends on T006-T008) → T010 (depends on T009)
- US2: T011 → T012 sequential
- US3: T013, T014, T015 sequential
- US4: T016, T017, T018 can be interleaved

### Parallel Opportunities

```text
# Phase 3 — after Phase 2 complete:
T006 (ToolCallBadge), T007 (ChatMessage), T008 (ChatInput) — three different files, no dependencies

# Phase 3 + Phase 5 — can run in parallel:
US1 (chat components) + US3 (auth verification) — different files and concerns
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T005)
3. Complete Phase 3: User Story 1 (T006-T010)
4. **STOP and VALIDATE**: Navigate to /chat, send "Add buy groceries", verify response + tool badge
5. Deploy/demo if ready — this is the hackathon MVP

### Incremental Delivery

1. Setup + Foundational → Route accessible, nav linked
2. User Story 1 → Chat works with message exchange (MVP!)
3. User Story 3 → Auth verified and hardened
4. User Story 2 → Conversation persistence across refreshes
5. User Story 4 → Loading + error handling polished
6. Polish → Theme + responsive verified

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No new npm dependencies needed — all using existing packages
- All components use existing CSS variables for theme support
- The apiClient (Axios) JWT interceptor handles auth automatically
- chat_conversation_id in localStorage is the only persistent client state
