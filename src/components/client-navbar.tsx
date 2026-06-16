"use client";

import React from "react";
import { config } from "@/lib/config";
import { useSiteInfo } from "@/contexts/site-info-context";
import { ClientThemeToggle } from "@/components/client-theme-toggle";

// 独立的管理后台链接组件
const AdminLink = () => (
  <a
    href="/admin"
    title="进入管理后台"
    className="inline-flex h-9 w-9 items-center justify-center rounded-md glass-light transition-colors hover:bg-secondary/50"
  >
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
    <span className="sr-only">进入管理后台</span>
  </a>
);

interface ClientNavbarProps {
  fallbackTitle?: string;
}

/**
 * 客户端导航栏组件
 * 使用 useSiteInfo hook 动态获取站点信息并更新导航栏标题
 */
export const ClientNavbar: React.FC<ClientNavbarProps> = ({
  fallbackTitle = config.siteTitle,
}) => {
  const { siteInfo } = useSiteInfo();

  // 使用站点信息中的 sitename，如果没有则使用 fallbackTitle
  const siteTitle = siteInfo?.sitename?.trim() || fallbackTitle;

  return (
    <header className="sticky top-0 z-50 navbar-glass">
      <div className="flex h-14 items-center justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold">
            <span className="text-xl">{siteTitle}</span>
          </div>

          <div className="flex items-center space-x-2">
            <ClientThemeToggle />
            <AdminLink />
          </div>
        </div>
      </div>
    </header>
  );
};
