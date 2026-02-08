'use client';

import React from 'react';
import { Calendar, CheckCircle, PlusCircle, TrendingUp, ListTodo } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TodoList } from '@/components/todo/TodoList';

const DashboardPage = () => {
  // Mock stats for the dashboard
  const stats = [
    { title: 'Total Tasks', value: '24', change: '+2 from last week', icon: ListTodo, color: 'bg-blue-500' },
    { title: 'Completed', value: '18', change: '+5 from last week', icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Pending', value: '6', change: '-3 from last week', icon: Calendar, color: 'bg-yellow-500' },
    { title: 'Productivity', value: '75%', change: '+12% from last week', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md-items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Task
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Todo List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <TodoList />
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar with quick stats and upcoming tasks */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Today's Tasks</span>
                  <span className="font-medium text-slate-900">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Overdue</span>
                  <span className="font-medium text-red-500">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">High Priority</span>
                  <span className="font-medium text-orange-500">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Completed Today</span>
                  <span className="font-medium text-green-500">4</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Project Proposal</p>
                    <p className="text-sm text-slate-500">Tomorrow</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">High</span>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Team Meeting</p>
                    <p className="text-sm text-slate-500">In 2 days</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Medium</span>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Client Review</p>
                    <p className="text-sm text-slate-500">In 5 days</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Low</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;