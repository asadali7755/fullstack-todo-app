'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import type { Todo } from '@/types';

interface TodoContextType {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  fetchTodos: () => Promise<void>;
  createTodo: (title: string, description?: string) => Promise<{ success: boolean; error?: string }>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<{ success: boolean; error?: string }>;
  deleteTodo: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleTodoCompletion: (id: string) => Promise<{ success: boolean; error?: string }>;
  stats: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

// Map snake_case backend response to camelCase frontend type
const mapTodoFromApi = (apiTodo: any): Todo => ({
  id: apiTodo.id,
  title: apiTodo.title,
  description: apiTodo.description || '',
  completed: apiTodo.completed,
  userId: apiTodo.user_id,
  createdAt: apiTodo.created_at,
  updatedAt: apiTodo.updated_at,
  isEditing: false,
  isLoading: false,
});

export const TodoProvider = ({ children }: { children: React.ReactNode }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/todos/');
      const apiTodos = response.data.todos || [];
      setTodos(apiTodos.map(mapTodoFromApi));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTodo = async (title: string, description?: string) => {
    try {
      const response = await apiClient.post('/todos/', { title, description });
      const newTodo = mapTodoFromApi(response.data);
      setTodos(prev => [newTodo, ...prev]);
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create todo';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    try {
      const response = await apiClient.put(`/todos/${id}`, {
        title: updates.title,
        description: updates.description,
        completed: updates.completed,
      });
      const updated = mapTodoFromApi(response.data);
      setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update todo';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const deleteTodo = async (id: string) => {
    const backup = todos;
    setTodos(prev => prev.filter(t => t.id !== id));
    try {
      await apiClient.delete(`/todos/${id}`);
      return { success: true };
    } catch (err: any) {
      setTodos(backup);
      const msg = err.response?.data?.detail || 'Failed to delete todo';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const toggleTodoCompletion = async (id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed, isLoading: true } : t))
    );
    try {
      const response = await apiClient.patch(`/todos/${id}/complete`);
      const updated = mapTodoFromApi(response.data);
      setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
      return { success: true };
    } catch (err: any) {
      setTodos(prev =>
        prev.map(t => (t.id === id ? { ...t, completed: !t.completed, isLoading: false } : t))
      );
      const msg = err.response?.data?.detail || 'Failed to toggle todo';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length,
    completionRate: todos.length > 0 ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) : 0,
  };

  return (
    <TodoContext.Provider
      value={{ todos, loading, error, fetchTodos, createTodo, updateTodo, deleteTodo, toggleTodoCompletion, stats }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodoContext = () => {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodoContext must be used inside TodoProvider');
  return ctx;
};
