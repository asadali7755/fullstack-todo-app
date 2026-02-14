'use client';

import React from 'react';
import { ToolCallDisplay } from '@/types/chat';

interface ToolCallBadgeProps {
  toolCall: ToolCallDisplay;
}

export function ToolCallBadge({ toolCall }: ToolCallBadgeProps) {
  const isSuccess = toolCall.result.success;

  // Build a brief summary from the result
  let summary = '';
  if (isSuccess && toolCall.result.data) {
    const data = toolCall.result.data;
    if (data.title) {
      summary = String(data.title);
    } else if (data.count !== undefined) {
      summary = `${data.count} items`;
    } else if (data.message) {
      summary = String(data.message);
    }
  } else if (!isSuccess && toolCall.result.error) {
    summary = toolCall.result.error;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isSuccess
          ? 'bg-green-500/10 text-green-600'
          : 'bg-red-500/10 text-red-600'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`} />
      {toolCall.tool}
      {summary && (
        <span className="text-xs opacity-75">
          &middot; {summary.length > 30 ? summary.slice(0, 30) + '...' : summary}
        </span>
      )}
    </span>
  );
}
