'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error | null }> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error | null }> }) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

const DefaultFallback = ({ error }: { error: Error | null }) => (
  <div className="p-4 bg-red-100 text-red-700 rounded-md">
    <h2 className="text-lg font-semibold">Something went wrong</h2>
    {error && <p className="text-sm mt-1">{error.message}</p>}
    <button
      className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md text-sm"
      onClick={() => window.location.reload()}
    >
      Reload
    </button>
  </div>
);

export default ErrorBoundary;