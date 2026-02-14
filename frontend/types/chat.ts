// Chat-specific TypeScript types for ChatKit Frontend

export interface ToolCallDisplay {
  tool: string;
  arguments: Record<string, unknown>;
  result: {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallDisplay[];
  timestamp: Date;
  isError?: boolean;
}

export interface ChatApiRequest {
  message: string;
  conversation_id?: number;
}

export interface ChatApiResponse {
  conversation_id: number;
  message_id: number;
  response: string;
  tool_calls: ToolCallDisplay[];
}

export interface ChatApiError {
  detail: string;
}
