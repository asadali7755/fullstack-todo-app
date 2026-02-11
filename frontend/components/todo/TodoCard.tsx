'use client';

import React, { useState } from 'react';
import { useTodoContext } from '@/context/TodoContext';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { Todo } from '@/types';

interface TodoCardProps {
  todo: Todo;
}

export const TodoCard = ({ todo }: TodoCardProps) => {
  const { toggleTodoCompletion, updateTodo, deleteTodo } = useTodoContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    await toggleTodoCompletion(todo.id);
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setLoading(true);
    const result = await updateTodo(todo.id, {
      title: editTitle,
      description: editDescription,
    });
    if (result.success) setIsEditing(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this task?')) {
      setLoading(true);
      await deleteTodo(todo.id);
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-4">
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-glass-border bg-input text-sm text-txt placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40"
            placeholder="Task title"
            disabled={loading}
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-glass-border bg-input text-sm text-txt placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 resize-none"
            rows={2}
            placeholder="Description (optional)"
            disabled={loading}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={loading || !editTitle.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Check size={14} />
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditTitle(todo.title);
                setEditDescription(todo.description || '');
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-glass text-txt-secondary text-xs font-medium hover:bg-accent transition-colors"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group rounded-xl border p-4 transition-all duration-200 hover:bg-glass ${
        todo.completed
          ? 'bg-emerald-500/[0.03] border-emerald-500/10'
          : 'bg-card-bg border-glass-border hover:border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            todo.completed
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-muted hover:border-indigo-400'
          } ${loading ? 'opacity-50' : ''}`}
        >
          {todo.completed && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium leading-snug ${
              todo.completed ? 'line-through text-muted' : 'text-txt'
            }`}
          >
            {todo.title}
          </h3>
          {todo.description && (
            <p
              className={`mt-0.5 text-xs leading-relaxed ${
                todo.completed ? 'line-through text-muted' : 'text-txt-muted'
              }`}
            >
              {todo.description}
            </p>
          )}
          <p className="mt-1.5 text-[11px] text-muted">
            {new Date(todo.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
