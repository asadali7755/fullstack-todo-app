# Research: ChatKit Frontend

**Feature**: 005-chatkit-frontend
**Date**: 2026-02-14

## 1. ChatKit Library vs Custom Components

**Decision**: Build custom chat components with React.

**Rationale**: The existing app has a well-defined design system using
Tailwind CSS v4 with custom CSS variables, class-variance-authority
(cva) for component variants, and lucide-react for icons. A custom
implementation integrates seamlessly with the existing theme (light/dark),
sidebar layout, and component patterns. OpenAI's ChatKit library would
impose its own styling and be harder to match to the existing design.

**Alternatives considered**:
- OpenAI ChatKit: Faster to scaffold but creates visual inconsistency
  with existing dashboard design and locks into library conventions.
- Vercel AI SDK UI: Good streaming support but adds a dependency for
  a non-streaming endpoint; overkill for hackathon scope.

## 2. Conversation Persistence Strategy

**Decision**: Store `conversation_id` in localStorage; load messages
from client-side state (no backend history fetch endpoint).

**Rationale**: The backend only exposes `POST /api/chat` (no GET
endpoint for conversation history). Implementing a history fetch
endpoint is outside Part 2 scope. For the hackathon, localStorage +
client-side message state provides working persistence within a
session. Messages reset on hard refresh but conversation_id is
preserved, so the agent still has full context (loaded from DB on
backend side).

**Alternatives considered**:
- localStorage + backend history fetch: Requires new backend endpoint
  (`GET /api/chat/{conversation_id}/messages`) not in Part 1 scope.
- IndexedDB: Adds complexity for marginal benefit in hackathon demo.

## 3. Message Display Approach

**Decision**: Client-side append — maintain messages in React state.

**Rationale**: Each `POST /api/chat` response includes the assistant's
message. We append the user message immediately (optimistic) and the
assistant's response when it arrives. This is the simplest pattern and
gives instant UI feedback. The backend maintains the full history for
agent context.

**Alternatives considered**:
- Fetch full conversation on each response: Adds unnecessary network
  round-trips; the response already contains the assistant message.

## 4. Tool Call Display Format

**Decision**: Inline badges below the assistant message.

**Rationale**: Compact, non-intrusive, and matches the existing app's
minimal aesthetic. Each tool call is a small pill/badge showing the
tool name and success/failure status. This is sufficient for hackathon
reviewers to see that tools were invoked.

**Alternatives considered**:
- Expandable accordion: More detail but adds UI complexity and
  distracts from the conversation flow.

## 5. Route Structure

**Decision**: Place chat at `/chat` as a top-level route (not under
`/dashboard/chat`) with its own layout that reuses the dashboard
sidebar pattern.

**Rationale**: The user specified `/chat` as the route path. The
existing dashboard layout at `app/dashboard/layout.tsx` handles auth
checks and sidebar rendering. The chat page can follow the same
pattern — using the dashboard layout by being placed under the
dashboard route group, or replicating the auth check if placed at
top level. Since the user wants `/chat` (not `/dashboard/chat`), we
create `app/chat/page.tsx` with the same auth protection but its own
chat-optimized layout (full height, no TodoProvider wrapper).

**Alternative considered**:
- `/dashboard/chat`: Simpler (inherits dashboard layout) but doesn't
  match the user's specified `/chat` route.

## 6. Chat API Client Module

**Decision**: Create a dedicated `lib/chat-api.ts` module that uses
the existing `apiClient` (Axios instance from `lib/api-client.ts`).

**Rationale**: The existing Axios instance already has the JWT
interceptor that attaches `Authorization: Bearer <token>` to every
request. A thin wrapper function (`sendChatMessage`) calls
`apiClient.post('/api/chat', payload)` and returns the typed response.
This reuses existing auth infrastructure with zero duplication.

**Alternatives considered**:
- Direct fetch calls: Would duplicate the JWT interceptor logic.
- New Axios instance: Unnecessary; the existing one already handles
  auth and error responses.

## 7. State Management

**Decision**: Local React state (useState) in the chat page component.
No global store (Zustand/Context) needed.

**Rationale**: Chat state (messages, conversation_id, loading,
error) is local to the chat page. No other component needs access
to chat state. React useState is the simplest solution. The existing
app uses Zustand (in dependencies) but doesn't actively use it —
TodoContext uses React Context. For a single-page feature, local
state is sufficient.

**Alternatives considered**:
- ChatContext (React Context): Adds indirection for state that's only
  used by one page.
- Zustand store: Already in deps but not used; adding it for one page
  is premature.

## 8. Navigation Integration

**Decision**: Add "AI Assistant" nav item to the `navItems` array in
`app/dashboard/layout.tsx` with `MessageSquare` icon from lucide-react.
For the `/chat` route (outside `/dashboard`), check `pathname` matching.

**Rationale**: The sidebar nav is defined as a simple array at
dashboard/layout.tsx:39-43. Adding one entry is the smallest change.
Since `/chat` is outside the dashboard layout, the nav item uses a
regular Link that navigates away from the dashboard layout to the
chat layout.

**Alternative**: The nav item could be a `<Link>` that preserves
sidebar state, but since `/chat` has its own layout this is a clean
page transition.
