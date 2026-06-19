"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { config } from "@/lib/config";
import { useSiteInfo } from "@/contexts/site-info-context";
import { useServers } from "@/contexts/servers-context";
import { ClientThemeToggle } from "@/components/client-theme-toggle";
import { useThemeSettings } from "@/contexts/theme-settings-context";

const AdminLink = () => (
  <a
    href="/admin"
    title="进入管理后台"
    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
  >
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    <span className="sr-only">管理后台</span>
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
  const { settings } = useThemeSettings();
  const siteTitle = siteInfo?.sitename?.trim() || fallbackTitle;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 border-b ${
      scrolled
        ? "bg-background/95 backdrop-blur-xl shadow-sm border-hairline/80"
        : "bg-background/80 backdrop-blur-xl border-transparent"
    }`}>
      <div className="flex h-14 items-center justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold no-underline group min-w-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-primary text-primary-foreground text-sm font-bold group-hover:scale-105 transition-transform flex-shrink-0">
              {siteTitle.charAt(0).toUpperCase()}
            </div>
            <span className="text-base max-sm:text-sm font-semibold tracking-tight truncate">{siteTitle}</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-muted/50 transition-colors"
              title={isConnected ? "已连接" : `未连接${reconnectCount > 0 ? ` (已重连 ${reconnectCount} 次)` : ""}`}
            >
              <div className={`h-1.5 w-1.5 rounded-full transition-colors ${isConnected ? "bg-trading-up shadow-[0_0_4px_rgba(0,181,120,0.4)]" : "bg-trading-down"}`} />
              <span className="text-[11px] text-muted-foreground hidden sm:inline font-medium">{isConnected ? "实时" : "离线"}</span>
            </div>
            <ClientThemeToggle />
            {settings.showAdminLink && <div className="max-sm:hidden"><AdminLink /></div>}
          </div>
        </div>
      </div>
    </header>
  );
};