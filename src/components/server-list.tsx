"use client";

import React, { lazy, Suspense } from "react";
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
}

export const ServerList: React.FC<ServerListProps> = React.memo(function ServerList({ viewMode = "card" }) {
  const { data } = useServers();

  const sortedServers = data?.servers || [];

  if (!data?.servers) {
    return <ServerListSkeleton />;
  }

  if (sortedServers.length >= VIRTUALIZATION_THRESHOLD && viewMode === "card") {
    return (
      <Suspense fallback={<ServerListSkeleton />}>
        <VirtualizedServerList />
      </Suspense>
    );
  }

  if (viewMode === "list") {
    return <ServerListView servers={sortedServers} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 server-grid">
      {sortedServers.map((server, index) => (
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