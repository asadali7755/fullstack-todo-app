---
id: 3
title: Phase-3 Constitution Initial Ratification
stage: constitution
date: 2026-02-12
surface: agent
model: claude-opus-4-6
feature: none
branch: main
user: user
command: /sp.constitution
labels: ["constitution", "phase-3", "ai-chatbot", "mcp"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:

---

## Prompt

/sp.constitution AI-Powered Todo Chatbot (Phase-3)

Project context:
This is Spec 4 of a hackathon project demonstrating spec-driven, AI-native development. Specs 1-3 (Authentication, Backend API, Frontend) are complete and functional. Phase-3 adds conversational AI capabilities using MCP server architecture and OpenAI Agents SDK.

Core requirements:
- Natural language task management through AI chatbot interface
- MCP (Model Context Protocol) server exposing task operations as tools
- OpenAI Agents SDK for AI logic and tool orchestration
- Stateless chat endpoint with database-persisted conversation state
- ChatKit-based conversational UI
- Full integration with existing authentication and task management system

Technical constraints:
- Frontend: OpenAI ChatKit
- Backend: Python FastAPI (existing server, new /api/chat endpoint)
- AI Framework: OpenAI Agents SDK
- MCP Server: Official MCP SDK
- ORM: SQLModel (existing, extend with Conversation and Message models)
- Database: Neon Serverless PostgreSQL (existing)
- Authentication: Better Auth (existing, enforce user isolation in MCP tools)

Architecture principles:
- Stateless server design (all conversation state in database)
- MCP tools are the ONLY interface between AI agent and task database
- Each MCP tool enforces user_id authentication and isolation
- Agent uses MCP tools via function calling, never direct database access
- Conversation resumes correctly after server restart
- All tools return structured responses for agent consumption

Success criteria:
- AI understands natural language commands for task operations
- Agent correctly invokes MCP tools based on user intent
- Conversation history persists across sessions
- User isolation enforced at MCP tool level
- Graceful error handling and user-friendly responses
- ChatKit UI displays conversation and tool invocations
- Hackathon reviewers can trace: User message → Agent → MCP tool → Database → Response

Non-goals:
- Multi-user collaboration features
- Voice or image input
- Custom AI model training
- Complex task scheduling or reminders
- Mobile native apps
- Real-time WebSocket updates

Acceptance criteria:
1. User can manage tasks through natural language ("Add buy groceries", "Show pending tasks")
2. Agent correctly maps user intent to appropriate MCP tool
3. All 5 MCP tools (add, list, complete, delete, update) work correctly
4. Conversation state persists and resumes after server restart
5. User can only access their own tasks through chat (user isolation enforced)
6. Agent provides confirmations and helpful responses
7. Errors handled gracefully with clear user feedback
8. ChatKit UI shows conversation flow and tool usage

Timeline:
- Must fit within hackathon Phase-3 development window
- Implementation via Claude Code using Agentic Dev Stack workflow
- Spec → Plan → Tasks → Implementation (no manual coding)

Evaluation focus:
- Reviewers will judge: spec quality, implementation traceability, MCP architecture, AI integration, conversation flow, security enforcement

## Response snapshot

Created the Phase-3 project constitution at version 1.0.0 with six core principles:

1. **User Isolation & Security** — All operations scoped to authenticated user; MCP tools enforce user_id filtering; Argon2 hashing; JWT auth.
2. **MCP-Only Agent-Database Interface** — AI agent interacts with task DB exclusively through 5 MCP tools; no direct DB access.
3. **Stateless Server, Persistent State** — No in-memory session state; Conversation/Message models persist chat history; survives restarts.
4. **Spec-Driven Traceability** — Spec → Plan → Tasks → Implementation pipeline; PHRs and ADRs document all decisions.
5. **Structured Contracts & Typed Boundaries** — RESTful APIs with schemas; MCP tools return structured JSON; type safety at all layers.
6. **Separation of Concerns** — Frontend, Backend API, AI Agent, MCP Server, and Database are distinct layers with defined interfaces.

Additional sections: Technical Constraints, Development Workflow, Governance with semantic versioning policy.

Sync Impact Report included as HTML comment. All three templates verified compatible (no changes needed).

## Outcome

- ✅ Impact: Project constitution ratified at v1.0.0 with 6 principles tailored to Phase-3 AI chatbot architecture
- 🧪 Tests: N/A (governance document)
- 📁 Files: .specify/memory/constitution.md (created/overwritten)
- 🔁 Next prompts: /sp.specify to create the Phase-3 feature specification; /sp.plan for architecture planning
- 🧠 Reflection: Constitution captures both inherited constraints (auth, DB, frontend stack) and new Phase-3 concerns (MCP architecture, agent isolation, stateless chat). Principles are declarative and testable.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
