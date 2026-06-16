"use client";

import React, { useMemo } from "react";
import { useServers } from "@/contexts/servers-context";
import { ServerCard } from "./server-card";
import { ServerListSkeleton } from "./server-list-skeleton";

const MAX_ANIMATION_DELAY_ITEMS = 20;
const ANIMATION_DELAY_STEP_MS = 30;

export const VirtualizedServerList: React.FC = React.memo(function VirtualizedServerList() {
  const { data } = useServers();

  const sortedServers = useMemo(() => {
    if (!data?.servers) return [];
    return [...data.servers];
  }, [data?.servers]);

  if (!data?.servers || sortedServers.length === 0) {
    return <ServerListSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 server-grid">
      {sortedServers.map((server, index) => (
        <div
          key={server.gid || server.name}
          className="h-full animate-fade-in transform-gpu"
          style={{
            animationDelay: `${Math.min(index, MAX_ANIMATION_DELAY_ITEMS) * ANIMATION_DELAY_STEP_MS}ms`,
          }}
        >
          <ServerCard server={server} />
        </div>
      ))}
    </div>
  );
});
VirtualizedServerList.displayName = "VirtualizedServerList";
