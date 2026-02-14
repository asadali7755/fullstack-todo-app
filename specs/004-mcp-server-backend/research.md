# Research: MCP Server & Backend Integration

**Feature**: 004-mcp-server-backend
**Date**: 2026-02-13

## 1. OpenAI Agents SDK

**Decision**: Use `openai-agents` Python package for AI agent logic.

**Rationale**: The SDK provides native MCP server integration via
`MCPServerStdio`, automatic tool schema generation, conversation
history management via `result.to_input_list()`, and structured
tool call tracking via `ToolCallItem`/`ToolCallOutputItem`.

**Alternatives considered**:
- LangChain: Heavier dependency, more abstraction than needed.
- Raw OpenAI API with function calling: More manual work to manage
  tool loops and history. SDK abstracts this cleanly.
- LlamaIndex: Overkill for task management; designed for RAG.

**Key API patterns**:
```python
from agents import Agent, Runner, function_tool, MCPServerStdio

# Create agent with MCP server
async with MCPServerStdio(name="todo-mcp", params={
    "command": "python",
    "args": ["-m", "backend.src.mcp_server"],
}) as server:
    agent = Agent(
        name="Todo Assistant",
        instructions="...",
        mcp_servers=[server],
    )
    result = await Runner.run(agent, messages)

# Access tool calls from result
for item in result.new_items:
    if isinstance(item, ToolCallItem):
        # item.name, item.arguments
    if isinstance(item, ToolCallOutputItem):
        # item.output
```

**Install**: `pip install openai-agents`

## 2. MCP Python SDK

**Decision**: Use `mcp` Python package with `FastMCP` for tool
server creation.

**Rationale**: FastMCP provides a decorator-based API (`@mcp.tool()`)
that mirrors the simplicity of FastAPI route decorators. The SDK
handles JSON schema generation, input validation, and stdio
transport automatically.

**Alternatives considered**:
- Custom JSON-RPC server: Too much boilerplate for 5 tools.
- gRPC: Adds complexity; MCP is the standard the Agents SDK expects.
- Direct function_tool decorators: Simpler but bypasses MCP
  architecture requirement from constitution.

**Key API patterns**:
```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("todo-tools")

@mcp.tool()
async def add_task(user_id: str, title: str,
                   description: str = "") -> str:
    """Add a new task for the user."""
    # Use TodoService to create task
    return json.dumps({"task_id": str(task.id), ...})
```

**Install**: `pip install mcp`

## 3. MCP Tool Implementation Approach

**Decision**: Standalone functions with DB session injection.

**Rationale**: For a hackathon, standalone functions are faster to
write and easier to understand. Each tool is a single function
decorated with `@mcp.tool()`. DB session is created per-call using
the existing `get_session()` pattern. The 5 tools share minimal
code (only user_id validation), making duplication negligible.

**Alternatives considered**:
- Class-based tools with shared validation: DRY but adds
  inheritance hierarchy and setup overhead for only 5 functions.

## 4. Conversation History Loading Strategy

**Decision**: Load full history on every request.

**Rationale**: For a hackathon demo, conversations will be short
(< 50 messages typically). Full history ensures the agent always
has complete context. Windowed loading risks losing context that
the agent needs to reference earlier tasks.

**Alternatives considered**:
- Windowed history (last N messages): Faster for long conversations
  but risks context loss. Not worth the complexity for hackathon.

## 5. Agent Error Handling

**Decision**: Immediate return with user-friendly message.

**Rationale**: Retrying tool calls adds latency and complexity.
For a hackathon, fast feedback is better. If a tool fails, the
agent receives the error and formulates a helpful response. The
`try/except` in the chat endpoint catches agent-level failures
and returns a 500 with a friendly message.

**Alternatives considered**:
- Automatic retry (1-2 attempts): Adds 2-5s latency per retry.
  Transient DB errors are rare in demo scenarios.

## 6. Conversation ID Generation

**Decision**: Auto-increment integer primary key.

**Rationale**: Simpler for hackathon. Integer IDs are easier to
pass in API requests and display in logs. The existing Todo model
uses UUIDs, but conversations are a new domain — sequential IDs
suffice and are more readable for demo purposes.

**Alternatives considered**:
- UUID: Globally unique but harder to debug and unnecessary since
  conversations are always accessed through user_id scoping.

## 7. Tool Invocation Logging

**Decision**: Include `tool_calls` array in the chat API response.

**Rationale**: The frontend (Part 2) needs to display tool usage
in the ChatKit UI. Including tool_calls in the response JSON
enables this without additional database writes. Application-level
logging via FastAPI's LoggingMiddleware captures tool calls for
debugging.

**Alternatives considered**:
- Store tool calls as separate Message records: Adds DB writes
  and complicates the message schema.
- Log only in application logs: Not queryable by frontend.

## 8. MCP Server Transport

**Decision**: stdio transport via `MCPServerStdio`.

**Rationale**: The Agents SDK's `MCPServerStdio` launches the MCP
server as a subprocess and communicates via stdin/stdout. This is
the simplest integration pattern — no HTTP server setup, no port
management, no CORS. The MCP server script runs as a module
(`python -m backend.src.mcp_server`).

**Alternatives considered**:
- HTTP/SSE transport (`MCPServerStreamableHttp`): Requires a
  separate HTTP server, port allocation, and health checks.
  Overkill for a single-process hackathon deployment.

## 9. User ID Passing to MCP Tools

**Decision**: Pass `user_id` as a string parameter to each MCP tool.

**Rationale**: The chat endpoint extracts `user_id` from the JWT
via `get_current_user`. The agent's system prompt instructs it to
always pass the provided `user_id` to every tool call. Each tool
validates and converts the string to UUID before querying.

**Note**: The existing Todo model uses `uuid.UUID` for IDs. MCP
tools receive `user_id` as string and convert internally using
`uuid.UUID(user_id)`. Task IDs in MCP tools are also strings
representing UUIDs, matching the existing schema.
