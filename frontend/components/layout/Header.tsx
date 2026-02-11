'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/ui/ThemeToggle';

const Header: React.FC = () => {
  const { isAuthenticated, user, signOut } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Todo App
        </Link>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <nav>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span>Welcome, {user?.email}</span>
                <Button onClick={signOut} variant="outline">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Button asChild variant="outline">
                  <Link href="/(auth)/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/(auth)/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;