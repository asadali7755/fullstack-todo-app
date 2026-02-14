# Data Model: ChatKit Frontend

**Feature**: 005-chatkit-frontend
**Date**: 2026-02-14

## TypeScript Interfaces

### ChatMessage (UI display)

```typescript
interface ChatMessage {
  id: string;           // unique client-side ID (crypto.randomUUID or Date.now)
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallDisplay[];
  timestamp: Date;
  isError?: boolean;    // true for error messages displayed inline
}
```

### ToolCallDisplay

```typescript
interface ToolCallDisplay {
  tool: string;         // e.g. "add_task", "list_tasks"
  arguments: Record<string, unknown>;
  result: {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  };
}
```

### ChatApiRequest (POST /api/chat body)

```typescript
interface ChatApiRequest {
  message: string;            // 1-10000 chars
  conversation_id?: number;   // omit for new conversation
}
```

### ChatApiResponse (POST /api/chat response)

```typescript
interface ChatApiResponse {
  conversation_id: number;
  message_id: number;
  response: string;
  tool_calls: ToolCallDisplay[];
}
```

### ChatApiError (error response)

```typescript
interface ChatApiError {
  detail: string;
}
```

## State Shape (React component state)

```typescript
// Local state in chat page component
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [conversationId, setConversationId] = useState<number | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [input, setInput] = useState('');
```

## localStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `chat_conversation_id` | `string` (number serialized) | Persist conversation ID across page loads |

## Data Flow

```text
User types message
  → validate (non-empty, ≤10000 chars)
  → append ChatMessage(role='user') to messages[]
  → setIsLoading(true), disable input
  → POST /api/chat { message, conversation_id }
  → on success:
      → store conversation_id in state + localStorage
      → append ChatMessage(role='assistant', toolCalls) to messages[]
      → setIsLoading(false), enable + focus input
      → auto-scroll to bottom
  → on error:
      → append ChatMessage(role='assistant', isError=true) to messages[]
      → setIsLoading(false), enable input
```
