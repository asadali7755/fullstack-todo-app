'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useTodos } from '@/hooks/useTodos';
import type { Todo } from '@/types';

interface TodoCardProps {
  todo: Todo;
}

export const TodoCard = ({ todo }: TodoCardProps) => {
  const { toggleTodoCompletion, updateTodo, deleteTodo } = useTodos();
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
    setLoading(true);
    const result = await updateTodo(todo.id, {
      title: editTitle,
      description: editDescription,
    });

    if (result.success) {
      setIsEditing(false);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      setLoading(true);
      await deleteTodo(todo.id);
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${todo.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'} shadow-sm hover:shadow-md transition-shadow`}>
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={loading}
          />
          <div className="flex space-x-2">
            <Button onClick={handleSaveEdit} disabled={loading} size="sm">
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" disabled={loading} size="sm">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start space-x-3">
          <div className="pt-1">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-medium ${todo.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                {todo.title}
              </h3>
              {todo.completed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              )}
            </div>
            {todo.description && (
              <p className={`mt-1 text-sm ${todo.completed ? 'line-through text-slate-500' : 'text-slate-600'}`}>
                {todo.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">
                Created: {new Date(todo.createdAt).toLocaleDateString()}
              </p>
              {!todo.completed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};