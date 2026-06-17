'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen bg-background flex-col items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-sm">
        <p className="text-9xl font-bold tracking-tighter text-trading-down/15 select-none">!</p>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">出错了</h1>
          <p className="text-sm text-muted-foreground">抱歉，加载过程中出现了错误。</p>
        </div>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center text-sm font-semibold h-10 px-5 rounded-md bg-accent text-primary-foreground hover:bg-accent/90 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
} 