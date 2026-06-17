"use client";

import React from "react";
import { Server } from "@/lib/api";
import {
  formatDurationEnShort,
  formatBytes,
  formatPercent,
} from "@/lib/utils";
import {
  StatusIndicator,
  StatusBadge,
} from "./server";
import { Clock } from "lucide-react";

interface ServerListItemProps {
  server: Server;
}

const ServerListItem: React.FC<ServerListItemProps> = React.memo(
  function ServerListItem({ server }) {
    const isOnline = server.online;
    const cpuPercent = formatPercent(server.cpu, 100);
    const memPercent = formatPercent(server.memory_used, server.memory_total);
    const diskPercent = formatPercent(server.hdd_used, server.hdd_total);

    const uptime = React.useMemo(() => {
      if (!server.uptime) return "—";
      const match = server.uptime.match(/^(\d+)s$/);
      if (!match) return server.uptime;
      return formatDurationEnShort(parseInt(match[1], 10), 2);
    }, [server.uptime]);

    return (
      <div className="flex items-center gap-2 px-4 py-3 border-b border-hairline hover:bg-muted/50 transition-colors text-xs">
        <div className="flex items-center gap-2 min-w-0 flex-[3] sm:flex-[2]">
          <StatusIndicator isOnline={isOnline} />
          <span className="font-medium text-foreground truncate" suppressHydrationWarning>
            {server.alias || server.name}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-12 sm:w-16 h-1 rounded-full bg-secondary overflow-hidden flex-shrink-0">
            <div
              className={`h-full rounded-full transition-[width] duration-200 ${
                cpuPercent >= 90 ? "bg-trading-down" : cpuPercent >= 70 ? "bg-accent" : "bg-trading-up"
              }`}
              style={{ width: `${Math.min(cpuPercent, 100)}%` }}
            />
          </div>
          <span className="font-mono text-muted-foreground w-8 text-right flex-shrink-0 hidden sm:block">{cpuPercent}%</span>
        </div>

        <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
          <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden flex-shrink-0">
            <div
              className={`h-full rounded-full transition-[width] duration-200 ${
                memPercent >= 90 ? "bg-trading-down" : memPercent >= 70 ? "bg-accent" : "bg-trading-up"
              }`}
              style={{ width: `${Math.min(memPercent, 100)}%` }}
            />
          </div>
          <span className="font-mono text-muted-foreground w-8 text-right flex-shrink-0">{memPercent}%</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 flex-1 min-w-0">
          <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden flex-shrink-0">
            <div
              className={`h-full rounded-full transition-[width] duration-200 ${
                diskPercent >= 90 ? "bg-trading-down" : diskPercent >= 70 ? "bg-accent" : "bg-trading-up"
              }`}
              style={{ width: `${Math.min(diskPercent, 100)}%` }}
            />
          </div>
          <span className="font-mono text-muted-foreground w-8 text-right flex-shrink-0">{diskPercent}%</span>
        </div>

        <div className="hidden xl:block flex-1 min-w-0">
          <span className="font-mono text-muted-foreground" suppressHydrationWarning>
            {server.network_rx ? formatBytes(server.network_rx) + "/s" : "—"}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span suppressHydrationWarning>{uptime}</span>
          </div>
          <StatusBadge isOnline={isOnline} />
        </div>
      </div>
    );
  }
);
ServerListItem.displayName = "ServerListItem";

export { ServerListItem };