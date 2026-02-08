'use client';

import React, { useEffect } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { TodoCard } from '@/components/todo/TodoCard';
import { TodoForm } from '@/components/todo/TodoForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const TodoList = () => {
  const { todos, loading, error, fetchTodos } = useTodos();

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  if (loading && todos.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Add New Todo</h2>
        <TodoForm />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Todos ({todos.length})</h2>

        {loading && todos.length > 0 && (
          <div className="flex justify-center my-4">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {todos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No todos yet. Add one above to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {todos.map(todo => (
              <TodoCard key={todo.id} todo={todo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { TodoList };