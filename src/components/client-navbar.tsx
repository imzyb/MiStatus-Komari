"use client";

import React from "react";
import Link from "next/link";
import { config } from "@/lib/config";
import { useSiteInfo } from "@/contexts/site-info-context";
import { useServers } from "@/contexts/servers-context";
import { ClientThemeToggle } from "@/components/client-theme-toggle";

const AdminLink = () => (
  <a
    href="/admin"
    title="进入管理后台"
    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
  >
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    <span className="sr-only">进入管理后台</span>
  </a>
);

interface ClientNavbarProps {
  fallbackTitle?: string;
}

export const ClientNavbar: React.FC<ClientNavbarProps> = ({
  fallbackTitle = config.siteTitle,
}) => {
  const { siteInfo } = useSiteInfo();
  const { isConnected, reconnectCount } = useServers();
  const siteTitle = siteInfo?.sitename?.trim() || fallbackTitle;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-hairline">
      <div className="flex h-14 items-center justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold no-underline hover:opacity-80 transition-opacity">
            <span className="text-lg max-sm:text-base">{siteTitle}</span>
          </Link>

          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60" title={isConnected ? "已连接" : `未连接${reconnectCount > 0 ? ` (已重连 ${reconnectCount} 次)` : ""}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-trading-up" : "bg-trading-down"} transition-colors`} />
              <span className="text-[10px] text-muted-foreground hidden sm:inline">{isConnected ? "实时" : "离线"}</span>
            </div>
            <ClientThemeToggle />
            <div className="max-sm:hidden"><AdminLink /></div>
          </div>
        </div>
      </div>
    </header>
  );
};