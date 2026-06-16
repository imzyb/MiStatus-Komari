"use client";

import React, { lazy, Suspense } from "react";
import { useServers } from "@/contexts/servers-context";
import { ServerCard } from "./server-card";
import { LazyRender } from "./lazy-render";
import type { Server } from "@/lib/api";
import { ServerListSkeleton } from "./server-list-skeleton";

const VirtualizedServerList = lazy(() =>
  import("./virtualized-server-list").then((module) => ({
    default: module.VirtualizedServerList,
  }))
);

const VIRTUALIZATION_THRESHOLD = 50;

export const ServerList: React.FC = React.memo(function ServerList() {
  const { data } = useServers();

  const sortedServers = data?.servers || [];

  if (!data?.servers) {
    return <ServerListSkeleton />;
  }

  if (sortedServers.length >= VIRTUALIZATION_THRESHOLD) {
    return (
      <Suspense fallback={<ServerListSkeleton />}>
        <VirtualizedServerList />
      </Suspense>
    );
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

// ServerCardItem 组件，避免重复渲染
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
