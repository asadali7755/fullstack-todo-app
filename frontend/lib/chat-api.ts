import apiClient from './api-client';
import { ChatApiRequest, ChatApiResponse } from '@/types/chat';

export async function sendChatMessage(
  message: string,
  conversationId?: number
): Promise<ChatApiResponse> {
  const payload: ChatApiRequest = { message };
  if (conversationId) {
    payload.conversation_id = conversationId;
  }

  try {
    const response = await apiClient.post<ChatApiResponse>('/api/chat/', payload);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || '';

      switch (status) {
        case 401:
          localStorage.removeItem('access_token');
          window.location.href = '/sign-in';
          throw new Error('Your session has expired. Please sign in again.');
        case 403:
          localStorage.removeItem('chat_conversation_id');
          throw new Error('This conversation is no longer available. Starting fresh.');
        case 404:
          localStorage.removeItem('chat_conversation_id');
          throw new Error('Conversation not found. Starting a new one.');
        case 500:
          throw new Error('Something went wrong. Please try again.');
        default:
          throw new Error(detail || 'Your message couldn\'t be sent. Please check and try again.');
      }
    } else if (error.request) {
      throw new Error('Unable to reach the server. Check your connection.');
    }
    throw new Error('An unexpected error occurred.');
  }
}
