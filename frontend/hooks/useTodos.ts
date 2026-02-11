import { useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import type { Todo } from '@/types';

interface TodosState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

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
  const fetchTodos = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await withRetry(() => apiClient.get('/todos/'));
      // Backend returns: { todos: [...], total, offset, limit }
      // axios puts the body in response.data
      const apiTodos = response.data.todos || [];
      setState({
        todos: apiTodos.map(mapTodoFromApi),
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        todos: [],
        loading: false,
        error: error.response?.data?.detail || 'Failed to fetch todos',
      });
    }
  }, []);

  // Create a new todo
  const createTodo = async (title: string, description?: string) => {
    // Optimistic update: add the new todo to the list immediately
    const tempId = `temp-${Date.now()}`;
    const newTodo: Todo = {
      id: tempId,
      title,
      description: description || '',
      completed: false,
      userId: '',
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
        apiClient.post('/todos/', { title, description })
      );

      // Backend returns the created todo directly in response.data
      const createdTodo = mapTodoFromApi(response.data);

      setState(prev => ({
        ...prev,
        todos: prev.todos.map(todo =>
          todo.id === tempId ? createdTodo : todo
        ),
      }));

      return { success: true, data: createdTodo };
    } catch (error: any) {
      // Remove the optimistic todo if the request failed
      setState(prev => ({
        ...prev,
        todos: prev.todos.filter(todo => todo.id !== tempId),
        error: error.response?.data?.detail || 'Failed to create todo',
      }));

      return { success: false, error: error.response?.data?.detail || 'Failed to create todo' };
    }
  };

  // Update an existing todo
  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === id ? { ...todo, ...updates, isLoading: true } : todo
      ),
    }));

    try {
      const response = await withRetry(() =>
        apiClient.put(`/todos/${id}`, {
          title: updates.title,
          description: updates.description,
          completed: updates.completed,
        })
      );

      // Backend returns the updated todo directly
      const updatedTodo = mapTodoFromApi(response.data);

      setState(prev => ({
        ...prev,
        todos: prev.todos.map(todo =>
          todo.id === id ? updatedTodo : todo
        ),
      }));

      return { success: true, data: updatedTodo };
    } catch (error: any) {
      // Revert the optimistic update
      fetchTodos();

      setState(prev => ({
        ...prev,
        error: error.response?.data?.detail || 'Failed to update todo',
      }));

      return { success: false, error: error.response?.data?.detail || 'Failed to update todo' };
    }
  };

  // Delete a todo
  const deleteTodo = async (id: string) => {
    // Optimistic update: remove immediately
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
        error: error.response?.data?.detail || 'Failed to delete todo',
      }));

      return { success: false, error: error.response?.data?.detail || 'Failed to delete todo' };
    }
  };

  // Toggle todo completion status
  const toggleTodoCompletion = async (id: string) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed, isLoading: true } : todo
      ),
    }));

    try {
      const response = await withRetry(() =>
        apiClient.patch(`/todos/${id}/complete`)
      );

      // Backend returns the updated todo directly
      const updatedTodo = mapTodoFromApi(response.data);

      setState(prev => ({
        ...prev,
        todos: prev.todos.map(todo =>
          todo.id === id ? updatedTodo : todo
        ),
      }));

      return { success: true, data: updatedTodo };
    } catch (error: any) {
      // Revert the optimistic update
      setState(prev => ({
        ...prev,
        todos: prev.todos.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed, isLoading: false } : todo
        ),
        error: error.response?.data?.detail || 'Failed to toggle completion',
      }));

      return { success: false, error: error.response?.data?.detail || 'Failed to toggle completion' };
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
