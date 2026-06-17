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
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-hairline">
          <span className="flex-[3] sm:flex-[2]">服务器</span>
          <span className="flex-1">CPU</span>
          <span className="flex-1 hidden md:block">内存</span>
          <span className="flex-1 hidden lg:block">硬盘</span>
          <span className="flex-1 hidden xl:block">网络</span>
          <span className="flex items-center gap-3 flex-shrink-0">
            <span className="hidden sm:inline w-[64px]">运行</span>
            <span className="w-[32px]" />
          </span>
        </div>
        <div>
          {servers.map((server) => (
            <ServerListItem key={server.gid || server.name} server={server} />
          ))}
        </div>
        {servers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
            <svg className="h-10 w-10 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <path d="M2 9h20" />
              <path d="M9 21V9" />
            </svg>
            <p className="text-sm">暂无服务器</p>
          </div>
        )}
      </div>
    );
  }
);
ServerListView.displayName = "ServerListView";