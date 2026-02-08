import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import type { Todo } from '@/types';

interface TodosState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

// Retry mechanism helper
const withRetry = async <T>(fn: () => Promise<T>, retries: number = 3): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i === retries - 1) {
        throw lastError;
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  throw lastError;
};

const useTodos = () => {
  const [state, setState] = useState<TodosState>({
    todos: [],
    loading: false,
    error: null,
  });

  // Fetch all todos for the authenticated user
  const fetchTodos = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await withRetry(() =>
        apiClient.get<{ data: { todos: Todo[] } }>('/todos')
      );
      setState({
        todos: response.data.data.todos,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        todos: [],
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch todos',
      });
    }
  };

  // Create a new todo
  const createTodo = async (title: string, description?: string) => {
    // Optimistic update: add the new todo to the list immediately
    const tempId = `temp-${Date.now()}`;
    const newTodo: Todo = {
      id: tempId,
      title,
      description: description || '',
      completed: false,
      userId: '', // Will be filled by the backend
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEditing: false,
      isLoading: true,
    };

    setState(prev => ({
      ...prev,
      todos: [newTodo, ...prev.todos],
      loading: false,
    }));

    try {
      const response = await withRetry(() =>
        apiClient.post<{ data: Todo }>('/todos', {
          title,
          description,
        })
      );

      // Update with the actual server response
      setState(prev => ({
        ...prev,
        todos: prev.todos.map(todo =>
          todo.id === tempId ? { ...response.data.data, isLoading: false } : todo
        ),
      }));

      return { success: true, data: response.data.data };
    } catch (error: any) {
      // Remove the optimistic todo if the request failed
      setState(prev => ({
        ...prev,
        todos: prev.todos.filter(todo => todo.id !== tempId),
        error: error.response?.data?.message || 'Failed to create todo',
      }));

      return { success: false, error: error.response?.data?.message || 'Failed to create todo' };
    }
  };

  // Update an existing todo
  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    // Optimistic update: update the todo in the list immediately
    setState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === id ? { ...todo, ...updates, isLoading: true } : todo
      ),
    }));

    try {
      const response = await withRetry(() =>
        apiClient.put<{ data: Todo }>(`/todos/${id}`, updates)
      );

      setState(prev => ({
        ...prev,
        todos: prev.todos.map(todo =>
          todo.id === id ? { ...response.data.data, isLoading: false } : todo
        ),
      }));

      return { success: true, data: response.data.data };
    } catch (error: any) {
      // Revert the optimistic update if the request failed
      fetchTodos(); // Refresh the list to revert to server state

      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to update todo',
      }));

      return { success: false, error: error.response?.data?.message || 'Failed to update todo' };
    }
  };

  // Delete a todo
  const deleteTodo = async (id: string) => {
    // Optimistic update: remove the todo from the list immediately
    const todoToDelete = state.todos.find(todo => todo.id === id);
    setState(prev => ({
      ...prev,
      todos: prev.todos.filter(todo => todo.id !== id),
    }));

    try {
      await withRetry(() => apiClient.delete(`/todos/${id}`));

      return { success: true };
    } catch (error: any) {
      // Restore the todo if the request failed
      if (todoToDelete) {
        setState(prev => ({
          ...prev,
          todos: [...prev.todos, todoToDelete],
        }));
      }

      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to delete todo',
      }));

      return { success: false, error: error.response?.data?.message || 'Failed to delete todo' };
    }
  };

  // Toggle todo completion status
  const toggleTodoCompletion = async (id: string) => {
    // Optimistic update: toggle the completion status immediately
    setState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed, isLoading: true } : todo
      ),
    }));

    try {
      const response = await withRetry(() =>
        apiClient.patch<{ data: Todo }>(`/todos/${id}/complete`)
      );

      setState(prev => ({
        ...prev,
        todos: prev.todos.map(todo =>
          todo.id === id ? { ...response.data.data, isLoading: false } : todo
        ),
      }));

      return { success: true, data: response.data.data };
    } catch (error: any) {
      // Revert the optimistic update if the request failed
      setState(prev => ({
        ...prev,
        todos: prev.todos.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed, isLoading: false } : todo
        ),
        error: error.response?.data?.message || 'Failed to toggle completion',
      }));

      return { success: false, error: error.response?.data?.message || 'Failed to toggle completion' };
    }
  };

  return {
    ...state,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodoCompletion,
  };
};

export { useTodos };