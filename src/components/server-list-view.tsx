"use client";

import React from "react";
import type { Server } from "@/lib/api";
import { ServerListItem } from "./server-list-item";

interface ServerListViewProps {
  servers: Server[];
}

export const ServerListView: React.FC<ServerListViewProps> = React.memo(
  function ServerListView({ servers }) {
    return (
      <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-medium text-muted-foreground/70 tracking-wider border-b border-hairline/50">
          <span className="flex-[3] sm:flex-[2]">服务器</span>
          <span className="flex-1">CPU</span>
          <span className="flex-1 hidden md:block">内存</span>
          <span className="flex-1 hidden lg:block">硬盘</span>
          <span className="flex-1 hidden xl:block">网络</span>
          <span className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:inline w-[48px]">运行</span>
            <span className="w-[40px]" />
          </span>
        </div>
        <div>
          {servers.map((server) => (
            <ServerListItem key={server.gid || server.name} server={server} />
          ))}
        </div>
        {servers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground/50 space-y-2">
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="2" y="3" width="20" height="18" rx="3" />
              <path d="M2 9h20" />
              <path d="M9 21V9" />
            </svg>
            <p className="text-xs">暂无服务器</p>
          </div>
        )}
      </div>
    );
  }
);
ServerListView.displayName = "ServerListView";