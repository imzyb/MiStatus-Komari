"use client";

import React, { lazy, Suspense, useMemo } from "react";
import { useServers } from "@/contexts/servers-context";
import { ServerCard } from "./server-card";
import { ServerListView } from "./server-list-view";
import { ServerListSkeleton } from "./server-list-skeleton";
import type { Server } from "@/lib/api";
import type { ViewMode } from "./view-toggle";
import { filterServers } from "@/lib/utils/filter";
import { useCardColumns, gridColumnStyle } from "@/hooks/use-card-columns";

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

export const ServerList: React.FC<ServerListProps> = React.memo(function ServerList({ viewMode = "card", searchQuery = "" }) {
  const { data } = useServers();
  const cardCols = useCardColumns();

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
    <div className="grid gap-3 server-grid" style={gridColumnStyle(cardCols)}>
      {filteredServers.map((server) => (
        <ServerCardItem
          key={server.gid || server.name}
          server={server}
        />
      ))}
    </div>
  );
});
ServerList.displayName = "ServerList";

const ServerCardItem: React.FC<{ server: Server }> = React.memo(
  function ServerCardItem({ server }) {
    return (
      <div className="h-full">
        <ServerCard server={server} />
      </div>
    );
  }
);
ServerCardItem.displayName = "ServerCardItem";