'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-8 max-w-sm">
          <p className="text-9xl font-bold tracking-tighter text-accent/15 select-none">404</p>
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">页面未找到</h1>
            <p className="text-sm text-muted-foreground">
              您请求的页面不存在或已被移除
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center text-sm font-semibold h-10 px-5 rounded-md bg-accent text-primary-foreground hover:bg-accent/90 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}