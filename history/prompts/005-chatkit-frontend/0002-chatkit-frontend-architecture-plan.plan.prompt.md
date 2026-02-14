---
id: 2
title: ChatKit Frontend Architecture Plan
stage: plan
date: 2026-02-14
surface: agent
model: claude-opus-4-6
feature: 005-chatkit-frontend
branch: 005-chatkit-frontend
user: user
command: /sp.plan
labels: ["plan", "chatkit", "frontend", "architecture", "chat-ui"]
links:
  spec: specs/005-chatkit-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-chatkit-frontend/plan.md
  - specs/005-chatkit-frontend/research.md
  - specs/005-chatkit-frontend/data-model.md
  - specs/005-chatkit-frontend/quickstart.md
  - specs/005-chatkit-frontend/contracts/chat-api-client-contract.md
tests:

---

## Prompt

/sp.plan with detailed decisions on ChatKit library vs custom components, persistence strategy, message display approach, tool call format, route structure, API client, state management, and navigation integration.

## Response snapshot

Generated complete architecture plan with 5 artifacts:

1. **research.md** — 8 decisions: custom components over ChatKit library, localStorage persistence, client-side append, inline badges, /chat top-level route, reuse existing apiClient, local useState, navItems array addition.

2. **data-model.md** — TypeScript interfaces: ChatMessage, ToolCallDisplay, ChatApiRequest, ChatApiResponse, ChatApiError. State shape with useState. localStorage key: chat_conversation_id.

3. **contracts/chat-api-client-contract.md** — sendChatMessage function contract with error handling table (400/401/403/404/500/network) and side effects (401→redirect, 403→reset).

4. **quickstart.md** — Setup instructions and 12-item validation checklist.

5. **plan.md** — Full implementation plan: technical context (TS5/React19/Next16), constitution check (6/6 PASS), project structure (7 new + 1 modified file), 8 key decisions table, 10-step request flow, component architecture tree, styling strategy, 4 implementation phases, 5-layer user isolation.

## Outcome

- ✅ Impact: Complete architecture plan ready for /sp.tasks — 8 decisions documented, 7 new files mapped, 4 phases defined
- 🧪 Tests: Omitted per hackathon scope
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/chat-api-client-contract.md
- 🔁 Next prompts: /sp.tasks to generate implementation task list
- 🧠 Reflection: Explored full frontend codebase to understand existing patterns (dashboard layout, API client with JWT interceptor, Tailwind theme system). Key insight: existing apiClient already has JWT interceptor so chat-api.ts is a thin wrapper, not a new auth implementation.

## Evaluation notes (flywheel)

- Failure modes observed: Constitution reverted to template (restored); PowerShell script arg parsing error (worked around)
- Graders run and results (PASS/FAIL): Constitution check 6/6 PASS, all research decisions documented with rationale
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
