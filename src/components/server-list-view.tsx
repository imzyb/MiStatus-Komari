"use client";

import React from "react";
import type { Server } from "@/lib/api";
import { ServerListItem } from "./server-list-item";

interface ServerListViewProps {
  servers: Server[];
}

export const ServerListView: React.FC<ServerListViewProps> = React.memo(
  function ServerListView({ servers }) {
    if (servers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground/50 space-y-2">
          <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="2" y="3" width="20" height="18" rx="3" />
            <path d="M2 9h20" />
            <path d="M9 21V9" />
          </svg>
          <p className="text-xs">暂无服务器</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* 表头 */}
        <div className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-medium text-muted-foreground/60 tracking-wider">
          <span className="w-[35%] sm:w-[25%]">服务器</span>
          <span className="w-[20%] sm:w-[15%]">CPU</span>
          <span className="hidden md:block w-[15%]">内存</span>
          <span className="hidden lg:block w-[15%]">硬盘</span>
          <span className="hidden xl:block w-[15%]">流量</span>
          <span className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <span className="hidden sm:inline-block w-[56px] text-right">运行</span>
            <span className="w-[40px]" />
          </span>
        </div>

        {/* 列表项 */}
        {servers.map((server) => (
          <ServerListItem key={server.gid || server.name} server={server} />
        ))}
      </div>
    );
  }
);
ServerListView.displayName = "ServerListView";