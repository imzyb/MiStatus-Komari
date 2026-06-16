'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <p className="text-8xl font-bold tracking-tighter text-muted-foreground/20">404</p>
          <h1 className="text-2xl font-semibold tracking-tight">页面未找到</h1>
          <p className="text-sm text-muted-foreground">
            您请求的页面不存在或已被移除
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center text-sm font-medium h-9 px-4 rounded-md border border-border bg-background hover:bg-secondary transition-colors"
          >
            返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}