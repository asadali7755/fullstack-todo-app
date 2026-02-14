# Quickstart: ChatKit Frontend

**Feature**: 005-chatkit-frontend
**Date**: 2026-02-14

## Prerequisites

- Backend running with `/api/chat` endpoint (from Part 1 / feature 004)
- Frontend running (`npm run dev` in `frontend/`)
- User registered and able to log in

## Quick Test

1. Start the backend: `cd backend && uvicorn src.main:app --port 8000`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:3000/sign-in` and log in
4. Click "AI Assistant" in the sidebar
5. Type "Add buy groceries to my list" and press Enter
6. Verify: assistant responds with confirmation, tool badge shows "add_task"

## File Structure

```text
frontend/
├── app/
│   └── chat/
│       ├── layout.tsx          # Chat layout (auth check, sidebar, full-height)
│       └── page.tsx            # Chat page component (message state, input, display)
├── components/
│   └── chat/
│       ├── ChatInterface.tsx   # Main chat container (messages + input)
│       ├── ChatMessage.tsx     # Single message bubble (user/assistant)
│       ├── ChatInput.tsx       # Message input with send button
│       └── ToolCallBadge.tsx   # Inline tool invocation badge
├── lib/
│   └── chat-api.ts             # sendChatMessage function using apiClient
└── types/
    └── chat.ts                 # ChatMessage, ChatApiResponse, ToolCallDisplay types
```

## Architecture Flow

```text
User Input → ChatInput.tsx
  → ChatInterface.tsx (state management)
    → lib/chat-api.ts → apiClient (Axios + JWT interceptor)
      → POST /api/chat/ (backend)
    ← ChatApiResponse
  → ChatMessage.tsx (render assistant response)
    → ToolCallBadge.tsx (render tool calls)
```

## Validation Checklist

- [ ] `/chat` route loads for authenticated users
- [ ] Unauthenticated users redirected to `/sign-in`
- [ ] "AI Assistant" visible in dashboard sidebar
- [ ] Message sends on Enter key and Send button
- [ ] User message appears immediately (right-aligned)
- [ ] Loading indicator shows during processing
- [ ] Assistant response appears (left-aligned)
- [ ] Tool call badges visible for tool invocations
- [ ] Conversation persists across page navigation
- [ ] Error messages are human-readable
- [ ] Light and dark themes both render correctly
- [ ] Auto-scroll to latest message works
