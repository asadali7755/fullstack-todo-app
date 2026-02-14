# Implementation Plan: ChatKit Frontend

**Branch**: `005-chatkit-frontend` | **Date**: 2026-02-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-chatkit-frontend/spec.md`

## Summary

Build a custom chat interface at `/chat` that lets authenticated users
manage tasks through natural language conversation. The frontend sends
messages to `POST /api/chat` (from Part 1), renders assistant responses
with inline tool call badges, and persists conversation_id in
localStorage. Uses the existing Axios API client (JWT interceptor),
Tailwind CSS theme system, and dashboard sidebar pattern.

## Technical Context

**Language/Version**: TypeScript 5 / React 19 / Next.js 16.1.6
**Primary Dependencies**: Axios (API client), lucide-react (icons), Tailwind CSS v4, cva (variants)
**Storage**: localStorage (conversation_id persistence)
**Testing**: Omitted (hackathon)
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web application (frontend only — Part 2)
**Performance Goals**: <1s UI rendering overhead on top of backend response time
**Constraints**: No new dependencies; reuse existing design system
**Scale/Scope**: 1 new route, 4 new components, 1 new API module, 1 new type file, 1 layout modification

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Check | Status |
|---|-----------|-------|--------|
| I | User Isolation & Security | Chat page is protected route; JWT attached to all API calls via existing interceptor; no cross-user data accessible | PASS |
| II | MCP-Only Agent-Database Interface | Frontend does not interact with DB or MCP — calls only POST /api/chat | PASS (N/A for frontend) |
| III | Stateless Server, Persistent State | Frontend stores only conversation_id in localStorage; full state on backend | PASS |
| IV | Spec-Driven Traceability | Following SDD pipeline: spec → plan → tasks → implement | PASS |
| V | Structured Contracts & Typed Boundaries | TypeScript interfaces for all API request/response types; API client contract defined | PASS |
| VI | Separation of Concerns | Components (UI), lib (API), types (data), layout (auth) — each has single responsibility | PASS |

All gates PASS. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-chatkit-frontend/
├── plan.md                              # This file
├── research.md                          # 8 research decisions
├── data-model.md                        # TypeScript interfaces + state shape
├── quickstart.md                        # Setup + validation checklist
├── contracts/
│   └── chat-api-client-contract.md      # sendChatMessage contract
└── tasks.md                             # (created by /sp.tasks)
```

### Source Code (new + modified files)

```text
frontend/
├── app/
│   ├── chat/
│   │   ├── layout.tsx          # NEW — Chat layout (auth, sidebar, full-height)
│   │   └── page.tsx            # NEW — Chat page (state, input, messages)
│   └── dashboard/
│       └── layout.tsx          # MODIFIED — Add "AI Assistant" nav item
├── components/
│   └── chat/
│       ├── ChatInterface.tsx   # NEW — Main chat container
│       ├── ChatMessage.tsx     # NEW — Message bubble (user/assistant)
│       ├── ChatInput.tsx       # NEW — Input bar with send button
│       └── ToolCallBadge.tsx   # NEW — Tool invocation badge
├── lib/
│   └── chat-api.ts             # NEW — sendChatMessage wrapper
└── types/
    └── chat.ts                 # NEW — Chat-specific TypeScript types
```

**Structure Decision**: Frontend-only feature. 7 new files, 1 modified file.
All new files follow existing directory conventions (app/ for routes,
components/ for UI, lib/ for utilities, types/ for interfaces).

## Key Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Component library | Custom React components | Matches existing design system (Tailwind + cva + lucide) |
| 2 | Persistence | localStorage (conversation_id only) | No backend history endpoint; simplest for hackathon |
| 3 | Message state | Client-side append (useState) | Instant UI feedback; backend maintains full history |
| 4 | Tool call display | Inline badges below message | Compact, non-intrusive, matches app aesthetic |
| 5 | Route path | `/chat` (top-level, own layout) | Matches user requirement; separate layout for full-height chat |
| 6 | API client | Reuse existing apiClient (Axios) | JWT interceptor already handles auth; zero duplication |
| 7 | State management | Local useState (no Zustand/Context) | State is page-local; no other component needs it |
| 8 | Nav integration | Add item to navItems array in dashboard layout | Smallest change; one-line addition |

## Request Flow

```text
1. User navigates to /chat
2. Chat layout checks auth (redirect to /sign-in if needed)
3. Chat page loads → check localStorage for chat_conversation_id
4. If conversation_id exists → set in state (messages start empty client-side)
5. User types message → validate (non-empty, ≤10000 chars)
6. Append user message to messages[] (optimistic)
7. Set isLoading=true, disable input
8. Call sendChatMessage(message, conversationId)
   → apiClient.post('/api/chat/', { message, conversation_id })
   → JWT attached automatically by interceptor
9. On 200 OK:
   → Store conversation_id in state + localStorage
   → Extract response text + tool_calls from body
   → Build ChatMessage(role='assistant', content, toolCalls)
   → Append to messages[]
   → Set isLoading=false, enable + focus input
   → Auto-scroll to bottom
10. On error:
    → Build ChatMessage(role='assistant', isError=true, content=friendlyMessage)
    → Append to messages[]
    → Handle special cases (401→redirect, 403→reset conversation)
    → Set isLoading=false, enable input
```

## Component Architecture

```text
app/chat/layout.tsx
  ├── Auth check (useAuth hook)
  ├── Sidebar (same pattern as dashboard layout)
  └── children (page.tsx)

app/chat/page.tsx
  ├── State: messages[], conversationId, isLoading, input
  ├── localStorage read on mount (conversation_id)
  └── ChatInterface.tsx
        ├── Scrollable message area
        │   ├── Empty state (when no messages)
        │   ├── ChatMessage.tsx × N
        │   │   ├── User message (right-aligned, user avatar)
        │   │   ├── Assistant message (left-aligned, bot icon)
        │   │   └── ToolCallBadge.tsx × N (inline below assistant text)
        │   └── Loading indicator (pulsing dots)
        └── ChatInput.tsx
              ├── Textarea (auto-resize)
              ├── Character count (near limit)
              └── Send button (disabled when empty or loading)
```

## Styling Strategy

- Use existing CSS variables: `--background`, `--card-bg`, `--glass`,
  `--text-primary`, `--text-secondary`, `--text-muted`
- User messages: `bg-indigo-500/10` with `text-indigo-500` accent
  (matches active nav item style)
- Assistant messages: `bg-glass` with `text-txt` (matches card style)
- Tool badges: small pills with `bg-green-500/10 text-green-600` for
  success, `bg-red-500/10 text-red-600` for errors
- Full-height layout: `h-[calc(100vh-4rem)]` for chat area
- Input at bottom: `sticky bottom-0` with glass background

## Implementation Phases

### Phase 1: Route + Navigation (FR-001, FR-002)
- Create `app/chat/layout.tsx` with auth check
- Create `app/chat/page.tsx` (minimal placeholder)
- Add "AI Assistant" to dashboard sidebar navItems

### Phase 2: Types + API Client (FR-004, FR-008)
- Create `types/chat.ts` with all TypeScript interfaces
- Create `lib/chat-api.ts` with `sendChatMessage` function

### Phase 3: Chat Components (FR-003, FR-005, FR-006, FR-007, FR-012, FR-013)
- Create `ChatInput.tsx` — input bar with validation
- Create `ChatMessage.tsx` — message bubbles
- Create `ToolCallBadge.tsx` — inline tool badges
- Create `ChatInterface.tsx` — container with scroll + state

### Phase 4: Integration + Polish (FR-009, FR-010, FR-011)
- Wire up state management in page.tsx
- localStorage persistence for conversation_id
- Error handling for all HTTP status codes
- Theme support verification
- Auto-scroll behavior

## User Isolation (5-Layer Enforcement)

1. **Route protection**: Chat layout checks `isAuthenticated`
2. **JWT injection**: Axios interceptor reads `access_token` from localStorage
3. **Backend auth**: `/api/chat` endpoint calls `get_current_user` from JWT
4. **Service layer**: `chat_service` scopes conversation to user_id
5. **MCP tools**: Each tool receives user_id, TodoService filters by it

Frontend enforces layers 1-2; backend enforces layers 3-5.
