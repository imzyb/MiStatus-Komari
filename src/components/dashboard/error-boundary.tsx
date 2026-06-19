'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export function DashboardErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [state, setState] = React.useState<ErrorBoundaryState>({ hasError: false, error: null });

  React.useEffect(() => {
    const handler = (error: ErrorEvent) => {
      if (error.message?.includes('ServerDashboardStats')) {
        setState({ hasError: true, error: error.error || new Error(error.message) });
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (state.hasError) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="rounded-2xl bg-card border border-hairline/80 shadow-sm p-4">
        <p className="text-sm text-muted-foreground">监控概览加载失败</p>
        <button
          type="button"
          onClick={() => setState({ hasError: false, error: null })}
          className="mt-2 text-xs text-primary hover:underline"
        >
          重试
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
