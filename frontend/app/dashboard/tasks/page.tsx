'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTodoContext } from '@/context/TodoContext';
import { TodoCard } from '@/components/todo/TodoCard';
import { TodoForm } from '@/components/todo/TodoForm';
import {
  Search as SearchIcon,
  List as ListIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Plus as PlusIcon
} from 'lucide-react';

const TasksPage = () => {
  const { todos, loading, fetchTodos } = useTodoContext();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'az'>('newest');

  useEffect(() => {
    fetchTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAndSortedTodos = useMemo(() => {
    let result = [...todos];

    if (searchTerm) {
      result = result.filter(todo =>
        todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filter === 'active') {
      result = result.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
      result = result.filter(todo => todo.completed);
    }

    if (sort === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sort === 'az') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [todos, searchTerm, filter, sort]);

  const counts = {
    all: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-txt">My Tasks</h1>
          <p className="text-txt-muted mt-1">Manage your tasks efficiently</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <PlusIcon className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl bg-card-bg border border-glass-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
            <input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-glass-border bg-input text-sm text-txt placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-glass rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-txt-muted hover:text-txt'
              }`}
            >
              <ListIcon className="w-4 h-4" />
              All ({counts.all})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-txt-muted hover:text-txt'
              }`}
            >
              <CircleIcon className="w-4 h-4" />
              Active ({counts.active})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-txt-muted hover:text-txt'
              }`}
            >
              <CheckCircleIcon className="w-4 h-4" />
              Done ({counts.completed})
            </button>
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="border border-glass-border rounded-lg px-3 py-2 text-sm bg-input text-txt focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">A-Z</option>
          </select>
        </div>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="rounded-2xl bg-card-bg border border-glass-border p-6">
          <TodoForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {/* Task Count */}
      <p className="text-sm text-muted">
        Showing {filteredAndSortedTodos.length} of {todos.length} tasks
      </p>

      {/* Task List */}
      <div className="space-y-3">
        {loading && filteredAndSortedTodos.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-glass rounded-full mb-4">
              <ListIcon className="w-8 h-8 text-muted" />
            </div>
            <p className="text-muted">Loading tasks...</p>
          </div>
        ) : filteredAndSortedTodos.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-card-bg border border-dashed border-glass-border">
            <div className="mx-auto w-16 h-16 bg-glass rounded-full flex items-center justify-center mb-4">
              <ListIcon className="w-8 h-8 text-muted" />
            </div>
            <p className="text-txt-muted">
              {searchTerm || filter !== 'all'
                ? 'No tasks match your search or filter.'
                : 'No tasks yet. Add one to get started!'}
            </p>
          </div>
        ) : (
          filteredAndSortedTodos.map(todo => (
            <TodoCard key={todo.id} todo={todo} />
          ))
        )}
      </div>
    </div>
  );
};

export default TasksPage;
