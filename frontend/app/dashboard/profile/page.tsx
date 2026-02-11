'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTodoContext } from '@/context/TodoContext';
import {
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  CircleIcon,
  ListIcon,
  LogOutIcon
} from 'lucide-react';

const ProfilePage = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const { stats } = useTodoContext();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted">Loading profile...</p>
      </div>
    );
  }

  const initials = user.email.charAt(0).toUpperCase();
  const accountCreateDate = new Date(user.createdAt || '').toLocaleDateString();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
          <span className="text-white text-xl font-semibold">{initials}</span>
        </div>
        <h1 className="text-2xl font-bold text-txt">{user.email}</h1>
        <p className="text-txt-muted">Member since {accountCreateDate}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card-bg border border-glass-border p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-3">
            <ListIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-txt">{stats.total}</p>
          <p className="text-sm text-txt-muted">Total Tasks</p>
        </div>

        <div className="rounded-2xl bg-card-bg border border-glass-border p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
            <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-txt">{stats.completed}</p>
          <p className="text-sm text-txt-muted">Completed</p>
        </div>

        <div className="rounded-2xl bg-card-bg border border-glass-border p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-3">
            <CircleIcon className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-txt">{stats.pending}</p>
          <p className="text-sm text-txt-muted">Pending</p>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="rounded-2xl bg-card-bg border border-glass-border p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-txt">Productivity</h3>
          <span className="text-sm font-medium text-txt-secondary">{stats.completionRate}%</span>
        </div>
        <div className="w-full bg-glass rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${stats.completionRate}%` }}
          ></div>
        </div>
        <p className="text-xs text-muted mt-2">
          {stats.completed} of {stats.total} tasks completed
        </p>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl bg-card-bg border border-glass-border p-6">
        <h3 className="font-semibold text-txt mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-glass rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-txt-muted" />
            </div>
            <div>
              <p className="text-sm text-muted">Email</p>
              <p className="font-medium text-txt">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-glass rounded-full flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-txt-muted" />
            </div>
            <div>
              <p className="text-sm text-muted">Joined</p>
              <p className="font-medium text-txt">{accountCreateDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="rounded-2xl bg-card-bg border border-glass-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-txt">Sign Out</h3>
            <p className="text-sm text-muted">End your current session</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors text-sm font-medium"
          >
            <LogOutIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
