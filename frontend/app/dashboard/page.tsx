'use client';

import React from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Header from '@/components/layout/Header';
import { TodoList } from '@/components/todo/TodoList';

const DashboardPage = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-6 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Todos</h1>
            <p className="text-gray-600">Manage your tasks efficiently</p>
          </div>
          <TodoList />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;