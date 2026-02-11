'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Circle, ListTodo, TrendingUp, Plus, Sparkles } from 'lucide-react';
import { useTodoContext } from '@/context/TodoContext';
import { TodoCard } from '@/components/todo/TodoCard';
import { TodoForm } from '@/components/todo/TodoForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const DashboardContent = () => {
  const { todos, loading, error, fetchTodos, stats } = useTodoContext();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showForm]);

  const statCards = [
    { title: 'Total Tasks', value: stats.total, icon: ListTodo, gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-500/10' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle2, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/10' },
    { title: 'Pending', value: stats.pending, icon: Circle, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-500/10' },
    { title: 'Productivity', value: `${stats.completionRate}%`, icon: TrendingUp, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-500/10' },
  ];

  const pendingTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-txt">Dashboard</h1>
          <p className="text-txt-muted mt-1">
            {stats.total === 0
              ? 'No tasks yet. Create your first one!'
              : `You have ${stats.pending} pending task${stats.pending !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add New Task
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="relative overflow-hidden rounded-2xl bg-card-bg border border-glass-border p-5 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-txt-muted">{stat.title}</p>
                  <p className="text-3xl font-bold text-txt mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${stat.bg} opacity-30`} />
            </div>
          );
        })}
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div ref={formRef} className="rounded-2xl bg-card-bg border border-glass-border p-6 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Sparkles size={18} className="text-indigo-500" />
            </div>
            <h2 className="text-lg font-semibold text-txt">Create New Task</h2>
          </div>
          <TodoForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">{error}</div>
      )}

      {/* Loading */}
      {loading && todos.length === 0 && (
        <div className="flex justify-center items-center h-40"><LoadingSpinner /></div>
      )}

      {/* Tasks */}
      {!loading && todos.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-card-bg border border-dashed border-glass-border">
          <div className="mx-auto w-20 h-20 bg-glass rounded-2xl flex items-center justify-center mb-5">
            <ListTodo size={32} className="text-txt-muted" />
          </div>
          <h3 className="text-lg font-semibold text-txt-secondary mb-1">No tasks yet</h3>
          <p className="text-txt-muted mb-6">Click "Add New Task" to get started</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Create Your First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {pendingTodos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Circle size={16} className="text-amber-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-txt-muted">Pending ({pendingTodos.length})</h2>
                </div>
                <div className="space-y-3">{pendingTodos.map(todo => <TodoCard key={todo.id} todo={todo} />)}</div>
              </div>
            )}
            {completedTodos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-txt-muted">Completed ({completedTodos.length})</h2>
                </div>
                <div className="space-y-3">{completedTodos.map(todo => <TodoCard key={todo.id} todo={todo} />)}</div>
              </div>
            )}
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-5">
            <div className="rounded-2xl bg-card-bg border border-glass-border p-5">
              <h3 className="text-sm font-semibold text-txt-secondary mb-4">Progress Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-txt-muted mb-1.5">
                    <span>Completion Rate</span>
                    <span className="font-semibold text-txt-secondary">{stats.completionRate}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-glass rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${stats.completionRate}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-3 rounded-xl bg-emerald-500/10">
                    <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
                    <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wide">Done</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-amber-500/10">
                    <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                    <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wide">Pending</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card-bg border border-glass-border p-5">
              <h3 className="text-sm font-semibold text-txt-secondary mb-4">Recent Activity</h3>
              {todos.length === 0 ? (
                <p className="text-xs text-txt-muted text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {todos.slice(0, 5).map(todo => (
                    <div key={todo.id} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${todo.completed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-txt-secondary truncate">{todo.title}</p>
                        <p className="text-[11px] text-txt-muted">{new Date(todo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardContent;
