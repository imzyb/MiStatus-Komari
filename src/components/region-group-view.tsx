"use client";

import React from "react";
import type { RegionGroup } from "@/lib/api";
import { ServerCard } from "./server-card";
import { ServerListView } from "./server-list-view";
import type { ViewMode } from "./view-toggle";

interface RegionGroupViewProps {
  regionGroups: RegionGroup[];
  showRegionHeaders?: boolean;
  viewMode?: ViewMode;
}

export const RegionGroupView: React.FC<RegionGroupViewProps> = ({
  regionGroups,
  showRegionHeaders = true,
  viewMode = "card",
}) => {
  return (
    <div className="space-y-6">
      {regionGroups.map(({ region, servers }, groupIndex) => (
        <div
          key={region}
          className="space-y-3 animate-slide-up"
          style={{ animationDelay: `${groupIndex * 100}ms` }}
        >
          {showRegionHeaders && (
            <div className="flex items-center gap-2 px-1 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-sm font-semibold">{region}</h3>
              <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted/60">
                {servers.length}
              </span>
            </div>
          )}

          {viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 server-grid">
              {servers.map((server) => (
                <div
                  key={server.gid}
                  className="animate-fade-in"
                >
                  <ServerCard server={server} />
                </div>
              ))}
            </div>
          ) : (
            <ServerListView servers={servers} />
          )}
        </div>
      ))}
    </div>
  );
};