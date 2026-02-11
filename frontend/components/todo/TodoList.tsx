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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">Add New Task</h2>
        <TodoForm />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Your Tasks ({todos.length})</h2>
          <div className="flex gap-2">
            <select className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Tasks</option>
              <option>Active</option>
              <option>Completed</option>
              <option>High Priority</option>
            </select>
          </div>
        </div>

        {loading && todos.length > 0 && (
          <div className="flex justify-center my-4">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {todos.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-500">No tasks yet. Add one above to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
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