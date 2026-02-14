'use client';

import React from 'react';
import { Bot, AlertCircle } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ToolCallBadge } from './ToolCallBadge';

interface ChatMessageProps {
  message: ChatMessageType;
  userInitial?: string;
}

export function ChatMessageBubble({ message, userInitial = 'U' }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 mb-4">
        <div className="max-w-[75%]">
          <div className="bg-indigo-500/10 text-txt rounded-2xl rounded-br-md px-4 py-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-[11px] text-txt-muted mt-1 text-right">{formatTime(message.timestamp)}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
          {userInitial}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start gap-3 mb-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isError
          ? 'bg-red-500/10 text-red-500'
          : 'bg-glass text-txt-muted'
      }`}>
        {isError ? <AlertCircle size={16} /> : <Bot size={16} />}
      </div>
      <div className="max-w-[75%]">
        <div className={`rounded-2xl rounded-bl-md px-4 py-3 ${
          isError
            ? 'bg-red-500/10 border border-red-500/20'
            : 'bg-glass'
        }`}>
          <p className={`text-sm whitespace-pre-wrap ${isError ? 'text-red-500' : 'text-txt'}`}>
            {message.content}
          </p>
        </div>
        {/* Tool call badges */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.toolCalls.map((tc, idx) => (
              <ToolCallBadge key={idx} toolCall={tc} />
            ))}
          </div>
        )}
        <p className="text-[11px] text-txt-muted mt-1">{formatTime(message.timestamp)}</p>
      </div>
    </div>
  );
}
