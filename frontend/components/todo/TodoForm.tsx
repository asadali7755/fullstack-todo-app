'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTodoContext } from '@/context/TodoContext';
import { Send } from 'lucide-react';

interface TodoFormData {
  title: string;
  description?: string;
}

interface TodoFormProps {
  onSuccess?: () => void;
}

export const TodoForm = ({ onSuccess }: TodoFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { createTodo } = useTodoContext();
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
        reset();
        onSuccess?.();
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
        <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm border border-red-500/20">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium text-txt-secondary">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          placeholder="What needs to be done?"
          className="w-full h-11 px-4 rounded-xl border border-glass-border bg-input text-sm text-txt placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all"
          {...register('title', { required: 'Title is required' })}
          disabled={loading}
        />
        {errors.title && (
          <p className="text-red-400 text-xs">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-txt-secondary">
          Description <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          placeholder="Add some details..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-glass-border bg-input text-sm text-txt placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all resize-none"
          {...register('description')}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Adding...
          </>
        ) : (
          <>
            <Send size={15} />
            Add Task
          </>
        )}
      </button>
    </form>
  );
};
