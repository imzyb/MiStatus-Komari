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

export class DashboardErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('DashboardErrorBoundary caught:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <div className="rounded-2xl bg-card border border-hairline/80 shadow-sm p-4 space-y-3">
          <p className="text-sm text-muted-foreground">监控概览加载失败</p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center justify-center text-xs font-medium h-8 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
          >
            重试
          </button>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
