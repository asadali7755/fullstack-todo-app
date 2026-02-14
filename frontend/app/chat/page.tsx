'use client';

import React, { useState, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';
import { sendChatMessage } from '@/lib/chat-api';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useAuth } from '@/hooks/useAuth';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  // Load conversation_id from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('chat_conversation_id');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        setConversationId(parsed);
      }
    }
  }, []);

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

  const handleSendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > 10000 || isLoading) return;

    // Append user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(trimmed, conversationId ?? undefined);

      // Store conversation_id
      setConversationId(response.conversation_id);
      localStorage.setItem('chat_conversation_id', String(response.conversation_id));

      // Append assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        toolCalls: response.tool_calls,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      // Map error to friendly message
      let friendlyMessage = 'Something went wrong. Please try again.';
      if (error instanceof Error) {
        friendlyMessage = error.message;
      }

      // Handle conversation reset on 403/404
      if (
        friendlyMessage.includes('no longer available') ||
        friendlyMessage.includes('not found')
      ) {
        setConversationId(null);
        localStorage.removeItem('chat_conversation_id');
      }

      // Append error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: friendlyMessage,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatInterface
      messages={messages}
      isLoading={isLoading}
      input={input}
      onInputChange={setInput}
      onSendMessage={handleSendMessage}
      userInitial={userInitial}
      hasConversationId={conversationId !== null}
    />
  );
}
