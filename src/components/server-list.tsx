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
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        没有找到匹配 &ldquo;{searchQuery}&rdquo; 的服务器
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