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
    <div className={`p-4 rounded-lg border ${todo.completed ? 'bg-green-50' : 'bg-white'} shadow-sm`}>
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            disabled={loading}
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={3}
            disabled={loading}
          />
          <div className="flex space-x-2">
            <Button onClick={handleSaveEdit} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" disabled={loading}>
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
          <div className="flex-1">
            <h3 className={`text-lg ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.title}
            </h3>
            {todo.description && (
              <p className={`mt-1 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-600'}`}>
                {todo.description}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Created: {new Date(todo.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};