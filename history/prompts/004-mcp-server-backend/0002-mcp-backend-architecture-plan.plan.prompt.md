---
id: 2
title: MCP Backend Architecture Plan
stage: plan
date: 2026-02-13
surface: agent
model: claude-opus-4-6
feature: 004-mcp-server-backend
branch: 004-mcp-server-backend
user: user
command: /sp.plan
labels: ["plan", "mcp-server", "architecture", "openai-agents", "fastapi"]
links:
  spec: specs/004-mcp-server-backend/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-mcp-server-backend/plan.md
  - specs/004-mcp-server-backend/research.md
  - specs/004-mcp-server-backend/data-model.md
  - specs/004-mcp-server-backend/quickstart.md
  - specs/004-mcp-server-backend/contracts/chat-api-contract.md
  - specs/004-mcp-server-backend/contracts/mcp-tools-contract.md
  - .specify/memory/constitution.md
tests:

---

## Prompt

/sp.plan

Create:
- MCP server architecture (FastAPI + MCP SDK + Agents + DB)
- Database schema (Conversation, Message models)
- Chat endpoint flow (stateless request cycle)
- Agent configuration (system prompt + tool registration)

Decisions needing documentation:
- MCP tool implementation: Standalone functions vs classes
  * Recommendation: Standalone functions (simpler for hackathon)
- Conversation history loading: Full vs windowed
  * Recommendation: Full history (optimize later if needed)
- Agent error handling: Retry vs immediate return
  * Recommendation: Immediate return with user-friendly message

Testing strategy:
- MCP tool tests: Valid/invalid user_id, missing params, cross-user access
- Chat endpoint tests: New conversation, resumption, validation errors
- Agent behavior tests: Natural language -> correct tool mapping
- Stateless tests: Server restart, conversation persistence
- Security tests: User isolation enforcement

Technical details:
- Follow spec-first, agentic development workflow
- Use SQLModel + Neon PostgreSQL
- Implement within existing FastAPI app
- Store all state in database (stateless server)

Organize by phases:
1. Database Models (Conversation, Message)
2. MCP Server + 5 Tools (add, list, complete, delete, update)
3. Chat API Endpoint (POST /api/chat)
4. OpenAI Agents SDK Integration
5. End-to-End Testing

## Response snapshot

Created complete implementation plan for 004-mcp-server-backend with 7 artifacts:

**Plan** (`plan.md`):
- Technical context: Python 3.11+, FastAPI, openai-agents, mcp (FastMCP), Neon PostgreSQL
- Constitution Check: All 6 principles PASS (pre- and post-design)
- 7 key decisions documented with rationale (tool style, history loading, error handling, IDs, logging, transport, user_id passing)
- 13-step request flow architecture diagram
- Agent system prompt with user_id injection
- 5-layer user isolation enforcement strategy
- 5 implementation phases mapped to functional requirements

**Research** (`research.md`):
- 9 decisions documented: OpenAI Agents SDK usage, MCP FastMCP pattern, standalone functions, full history, immediate errors, integer IDs, response JSON logging, stdio transport, string user_id passing

**Data Model** (`data-model.md`):
- 2 new entities: Conversation (Integer PK, user_id, timestamps) and Message (Integer PK, FK to Conversation, role, content)
- 2 existing entities unchanged: User, Todo
- MCP tool response schemas: consistent {success, data/error} JSON

**Contracts**:
- `chat-api-contract.md`: POST /api/chat with full request/response schemas and 5 error codes
- `mcp-tools-contract.md`: All 5 tools with parameter tables, success/error response examples

**Quickstart** (`quickstart.md`): Setup steps, new file manifest, curl test examples, validation checklist

## Outcome

- ✅ Impact: Complete architecture plan ready for /sp.tasks
- 🧪 Tests: N/A (planning document)
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, 2 contracts, constitution restored
- 🔁 Next prompts: /sp.tasks to generate implementation tasks
- 🧠 Reflection: Researched OpenAI Agents SDK and MCP SDK via web to get accurate API patterns. Key insight: MCPServerStdio provides cleanest integration between agent and MCP tools. Agent system prompt with injected user_id is the bridge between auth layer and tool layer.

## Evaluation notes (flywheel)

- Failure modes observed: Constitution was reverted to template; restored during plan execution
- Graders run and results (PASS/FAIL): Constitution Check — all 6 gates PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
