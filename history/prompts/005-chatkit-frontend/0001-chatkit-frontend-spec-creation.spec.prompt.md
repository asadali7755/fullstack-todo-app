---
id: 1
title: ChatKit Frontend Spec Creation
stage: spec
date: 2026-02-14
surface: agent
model: claude-opus-4-6
feature: 005-chatkit-frontend
branch: 005-chatkit-frontend
user: user
command: /sp.specify
labels: ["spec", "chatkit", "frontend", "chat-ui", "openai"]
links:
  spec: specs/005-chatkit-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-chatkit-frontend/spec.md
  - specs/005-chatkit-frontend/checklists/requirements.md
tests:

---

## Prompt

/sp.specify AI-Powered Todo Chatbot - Part 2: ChatKit Frontend

Target audience:
- Hackathon reviewers evaluating conversational UI and API integration
- Developers implementing ChatKit with authenticated backend

Focus:
- OpenAI ChatKit UI for conversational interface
- Authenticated API client with JWT token handling
- Message rendering (user, assistant, tool calls)
- Natural language input and error handling
- Integration with existing Next.js app (Spec 3)

Success criteria:
- Users can access chatbot via /chat route
- "AI Assistant" button in navbar navigates to chatbot
- Chat displays conversation history correctly
- Tool invocations visible inline (badges/indicators)
- JWT attached to all API requests
- Conversation persists across page refreshes
- Loading states and error messages work correctly
- Chatbot integrated seamlessly with existing app design

Constraints:
- Frontend: OpenAI ChatKit + Next.js 16 App Router
- API: POST /api/chat (from Part 1)
- Auth: Better Auth (JWT in Authorization header)
- State: conversation_id stored in localStorage
- Route: /chat (new page in existing app)
- Timeline: Hackathon Phase-3 window

Not building:
- Backend logic (covered in Part 1)
- Voice/multimodal input
- Real-time typing indicators
- Mobile native apps

## Response snapshot

Generated feature specification for ChatKit Frontend with:
- 4 user stories (US1: Chat Page with Message Exchange P1, US2: Conversation Persistence P2, US3: Authenticated API Integration P1, US4: Loading States and Error Handling P2)
- 14 acceptance scenarios across all stories
- 13 functional requirements (FR-001 to FR-013)
- 3 key entities (ChatMessage, Conversation, ToolCallDisplay)
- 7 measurable success criteria
- 5 edge cases
- Quality checklist: 16/16 items PASS

Explored full frontend codebase to understand existing patterns:
- Next.js 16 App Router with dashboard sidebar navigation
- Custom JWT auth (not Better Auth despite dependency)
- Axios API client with token interceptor
- Tailwind CSS v4 with light/dark theme support
- Existing nav items defined in dashboard/layout.tsx

## Outcome

- ✅ Impact: Complete spec ready for /sp.plan — 4 stories, 13 FRs, 7 SCs, 0 clarifications needed
- 🧪 Tests: Not applicable at spec stage
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan to create architecture plan, then /sp.tasks for implementation tasks
- 🧠 Reflection: Frontend exploration revealed custom JWT auth pattern (not Better Auth), Axios interceptor already handles token injection, and dashboard sidebar is in layout.tsx — all informing accurate spec requirements.

## Evaluation notes (flywheel)

- Failure modes observed: PowerShell script failed on long args (known issue from Part 1)
- Graders run and results (PASS/FAIL): Quality checklist 16/16 PASS, no NEEDS CLARIFICATION markers
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
