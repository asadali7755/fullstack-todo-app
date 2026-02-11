'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ListTodo, User, LogOut, CheckSquare, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TodoProvider } from '@/context/TodoContext';
import { useTheme } from '@/context/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isAuthenticated, isLoading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/tasks', label: 'My Tasks', icon: ListTodo },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
  ];

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';
  const pageTitle = pathname === '/dashboard'
    ? 'Dashboard'
    : pathname === '/dashboard/tasks'
      ? 'My Tasks'
      : pathname === '/dashboard/profile'
        ? 'Profile'
        : 'Dashboard';

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-glass-border bg-sidebar-bg flex flex-col transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-glass-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <CheckSquare size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-txt tracking-tight">TodoPro</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-txt-muted hover:text-txt">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-txt-muted">Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-500'
                        : 'text-txt-muted hover:bg-glass hover:text-txt-secondary'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="border-t border-glass-border p-4">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-txt-secondary truncate">{user?.email || 'User'}</p>
              <p className="text-[11px] text-txt-muted">Free Plan</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.push('/sign-in');
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-txt-muted hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-10 h-16 border-b border-glass-border bg-header-bg backdrop-blur-xl transition-colors duration-300">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-glass text-txt-muted"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-semibold text-txt">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-glass border border-glass-border hover:bg-accent text-txt-muted hover:text-txt transition-all duration-200"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div className="hidden sm:flex items-center gap-2.5">
                <div className="text-right">
                  <p className="text-sm font-medium text-txt-secondary">Welcome back</p>
                  <p className="text-[11px] text-txt-muted">{user?.email || 'User'}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {userInitial}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 max-w-7xl mx-auto">
          <TodoProvider>
            {children}
          </TodoProvider>
        </main>
      </div>
    </div>
  );
}
