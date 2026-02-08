'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { SignUpForm } from '@/components/auth/SignUpForm';

const SignUpPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6 pt-8 px-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Create Account</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
              Join us to manage your todos efficiently
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <SignUpForm />
          </CardContent>
        </Card>
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <a href="/sign-in" className="font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;