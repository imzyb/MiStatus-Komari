"use client";

import React, { lazy, Suspense, useMemo } from "react";
import { useServers } from "@/contexts/servers-context";
import { ServerCard } from "./server-card";
import { ServerListView } from "./server-list-view";
import { LazyRender } from "./lazy-render";
import type { Server } from "@/lib/api";
import { ServerListSkeleton } from "./server-list-skeleton";
import type { ViewMode } from "./view-toggle";

const VirtualizedServerList = lazy(() =>
  import("./virtualized-server-list").then((module) => ({
    default: module.VirtualizedServerList,
  }))
);

const VIRTUALIZATION_THRESHOLD = 50;

interface ServerListProps {
  viewMode?: ViewMode;
  searchQuery?: string;
}

function filterServers(servers: Server[], query: string): Server[] {
  if (!query.trim()) return servers;
  const q = query.toLowerCase();
  return servers.filter(
    (s) =>
      (s.alias || s.name).toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.location || "").toLowerCase().includes(q)
  );
}

export const ServerList: React.FC<ServerListProps> = React.memo(function ServerList({ viewMode = "card", searchQuery = "" }) {
  const { data } = useServers();

  const filteredServers = useMemo(() => {
    if (!data?.servers) return [];
    return filterServers(data.servers, searchQuery);
  }, [data?.servers, searchQuery]);

  if (!data?.servers) {
    return <ServerListSkeleton viewMode={viewMode} />;
  }

  if (filteredServers.length >= VIRTUALIZATION_THRESHOLD && viewMode === "card") {
    return (
      <Suspense fallback={<ServerListSkeleton viewMode={viewMode} />}>
        <VirtualizedServerList />
      </Suspense>
    );
  }

  if (viewMode === "list") {
    return <ServerListView servers={filteredServers} />;
  }

  if (filteredServers.length === 0 && searchQuery.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
        <svg className="h-12 w-12 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <p className="text-sm">没有找到匹配的服务器</p>
        <p className="text-xs opacity-60">尝试其他关键词或清除搜索</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 server-grid">
      {filteredServers.map((server, index) => (
        <ServerCardItem
          key={server.gid || server.name}
          server={server}
          index={index}
        />
      ))}
    </div>
  );
});
ServerList.displayName = "ServerList";

const ServerCardItem: React.FC<{ server: Server; index: number }> = React.memo(
  function ServerCardItem({ server, index }) {
    return (
      <LazyRender rootMargin="800px 0px" unmountOnExit={true}>
        <div
          className="h-full animate-fade-in"
          style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
        >
          <ServerCard server={server} />
        </div>
      </LazyRender>
    );
  }
);
ServerCardItem.displayName = "ServerCardItem";