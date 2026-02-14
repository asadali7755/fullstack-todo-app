# Chat API Client Contract

**Feature**: 005-chatkit-frontend
**Date**: 2026-02-14

## sendChatMessage Function

**File**: `frontend/lib/chat-api.ts`

### Signature

```typescript
async function sendChatMessage(
  message: string,
  conversationId?: number
): Promise<ChatApiResponse>
```

### Behavior

1. Calls `apiClient.post('/api/chat/', { message, conversation_id: conversationId })`
2. JWT token is automatically attached by the existing Axios request interceptor
3. Returns typed `ChatApiResponse` on success
4. Throws an error with a user-friendly message on failure

### Error Handling

| HTTP Status | User-Facing Message |
|-------------|-------------------|
| 400 | "Your message couldn't be sent. Please check and try again." |
| 401 | "Your session has expired. Please sign in again." |
| 403 | "This conversation is no longer available. Starting fresh." |
| 404 | "Conversation not found. Starting a new one." |
| 500 | "Something went wrong. Please try again." |
| Network Error | "Unable to reach the server. Check your connection." |

### Side Effects on Specific Errors

- **401**: Clear `access_token` from localStorage, redirect to `/sign-in`
- **403**: Clear `chat_conversation_id` from localStorage, reset conversation state
- **404**: Clear `chat_conversation_id` from localStorage, retry without conversation_id
