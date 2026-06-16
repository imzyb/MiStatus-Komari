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
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm">
        <p className="text-8xl font-bold tracking-tighter text-muted-foreground/20">!</p>
        <h1 className="text-2xl font-semibold tracking-tight">出错了</h1>
        <p className="text-sm text-muted-foreground">抱歉，加载过程中出现了错误。</p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center text-sm font-medium h-9 px-4 rounded-md border border-border bg-background hover:bg-secondary transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
} 