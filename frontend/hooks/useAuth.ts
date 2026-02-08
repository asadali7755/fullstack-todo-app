import { useState, useEffect } from 'react';
import { auth } from '@/lib/auth';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const session = await auth.getSession();

        if (session) {
          setAuthState({
            user: session.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to check authentication status',
        });
      }
    };

    checkAuthStatus();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await auth.signIn.email({
        email,
        password,
      });

      if (response?.session) {
        setAuthState({
          user: response.session.user as User,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }));
      return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const response = await auth.signUp.email({
        email,
        password,
        name: name || email.split('@')[0],
      });

      if (response?.user) {
        setAuthState({
          user: response.user as User,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign up failed',
      }));
      return { success: false, error: error instanceof Error ? error.message : 'Sign up failed' };
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'Sign out failed',
      }));
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
};

export { useAuth };