"use client";

import React from "react";
import { RegionGroup } from "@/lib/api";
import { ServerCard } from "./server-card";

interface RegionGroupViewProps {
  regionGroups: RegionGroup[];
  showRegionHeaders?: boolean;
}

export const RegionGroupView: React.FC<RegionGroupViewProps> = ({
  regionGroups,
  showRegionHeaders = true,
}) => {
  return (
    <div className="space-y-8">
      {regionGroups.map(({ region, servers }, groupIndex) => (
        <div
          key={region}
          className="space-y-4 animate-slide-up"
          style={{ animationDelay: `${groupIndex * 100}ms` }}
        >
          {showRegionHeaders && (
            <div className="flex items-center gap-2 border-b pb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              <h3 className="text-base font-semibold">{region}</h3>
              <span className="text-xs text-muted-foreground">
                {servers.length} 台服务器
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 server-grid">
            {servers.map((server, serverIndex) => (
              <div
                key={server.gid}
                className="animate-fade-in"
                style={{
                  animationDelay: `${Math.min(groupIndex * 100 + serverIndex * 30, 800)}ms`,
                }}
              >
                <ServerCard server={server} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
