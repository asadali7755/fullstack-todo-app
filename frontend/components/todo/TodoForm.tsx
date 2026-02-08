'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useTodos } from '@/hooks/useTodos';

interface TodoFormData {
  title: string;
  description?: string;
}

export const TodoForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { createTodo } = useTodos();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TodoFormData>();

  const onSubmit = async (data: TodoFormData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await createTodo(data.title, data.description);

      if (result.success) {
        reset(); // Clear the form after successful submission
      } else {
        setError(result.error || 'Failed to create todo');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title *
        </label>
        <Input
          id="title"
          placeholder="What needs to be done?"
          {...register('title', { required: 'Title is required' })}
          disabled={loading}
        />
        {errors.title && (
          <p className="text-red-600 text-sm">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          placeholder="Add details..."
          {...register('description')}
          disabled={loading}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Todo'}
      </Button>
    </form>
  );
};