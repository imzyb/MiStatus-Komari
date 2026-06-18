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
  const { setOpen } = useThemeSettings();
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
            <button type="button" onClick={() => setOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="主题设置" title="主题设置">
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <ClientThemeToggle />
            <div className="max-sm:hidden"><AdminLink /></div>
          </div>
        </div>
      </div>
    </header>
  );
};