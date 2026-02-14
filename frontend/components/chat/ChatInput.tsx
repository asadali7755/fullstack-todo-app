'use client';

import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

const MAX_LENGTH = 10000;
const WARN_THRESHOLD = 9000;

export function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim().length > 0 && value.length <= MAX_LENGTH) {
        onSend();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_LENGTH) {
      onChange(newValue);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [value]);

  const canSend = !isLoading && value.trim().length > 0 && value.length <= MAX_LENGTH;
  const showCharCount = value.length > WARN_THRESHOLD;

  return (
    <div className="sticky bottom-0 border-t border-glass-border bg-header-bg backdrop-blur-xl p-4">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={isLoading ? 'Waiting for response...' : 'Type a message... (Enter to send, Shift+Enter for new line)'}
            rows={1}
            className="w-full resize-none rounded-xl border border-glass-border bg-glass px-4 py-3 text-sm text-txt placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          {showCharCount && (
            <span className={`absolute bottom-1 right-2 text-[10px] ${
              value.length > MAX_LENGTH ? 'text-red-500' : 'text-txt-muted'
            }`}>
              {value.length}/{MAX_LENGTH}
            </span>
          )}
        </div>
        <button
          onClick={onSend}
          disabled={!canSend}
          className="shrink-0 p-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/20"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
