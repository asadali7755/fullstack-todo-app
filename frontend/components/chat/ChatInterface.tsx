'use client';

import React, { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ChatMessageBubble } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  userInitial?: string;
  hasConversationId?: boolean;
}

export function ChatInterface({
  messages,
  isLoading,
  input,
  onInputChange,
  onSendMessage,
  userInitial = 'U',
  hasConversationId = false,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <EmptyState hasConversationId={hasConversationId} />
          ) : (
            messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} userInitial={userInitial} />
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-glass text-txt-muted flex items-center justify-center shrink-0">
                <MessageSquare size={16} />
              </div>
              <div className="bg-glass rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-txt-muted animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-txt-muted animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-txt-muted animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <ChatInput
        value={input}
        onChange={onInputChange}
        onSend={onSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

function EmptyState({ hasConversationId }: { hasConversationId: boolean }) {
  if (hasConversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 mb-4">
          <MessageSquare size={32} className="text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold text-txt mb-2">Continue your conversation</h3>
        <p className="text-sm text-txt-muted">Type a message to pick up where you left off.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 mb-4">
        <MessageSquare size={32} className="text-indigo-500" />
      </div>
      <h3 className="text-lg font-semibold text-txt mb-2">AI Task Assistant</h3>
      <p className="text-sm text-txt-muted mb-6 max-w-md">
        Manage your tasks through conversation. I can add, list, complete, update, and delete tasks for you.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {['Add buy groceries', 'Show my tasks', 'Complete task #1'].map((suggestion) => (
          <span
            key={suggestion}
            className="px-3 py-1.5 rounded-full bg-glass border border-glass-border text-xs text-txt-muted"
          >
            Try: &ldquo;{suggestion}&rdquo;
          </span>
        ))}
      </div>
    </div>
  );
}
