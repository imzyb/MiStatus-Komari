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
import { useServerDetail } from "@/contexts/server-detail-context";

interface ServerListItemProps {
  server: Server;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-10 sm:w-14 h-1 rounded-full bg-muted overflow-hidden flex-shrink-0">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${
          percent >= 90 ? "bg-trading-down" : percent >= 70 ? "bg-accent" : "bg-trading-up"
        }`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

const ServerListItem: React.FC<ServerListItemProps> = React.memo(
  function ServerListItem({ server }) {
    const { openDetail } = useServerDetail();
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
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-hairline/50 hover:bg-muted/30 active:bg-muted/50 transition-colors text-xs cursor-pointer"
        onClick={() => openDetail(server)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-[3] sm:flex-[2]">
          <StatusIndicator isOnline={isOnline} />
          <span className="font-medium text-foreground truncate text-[11px]" suppressHydrationWarning>
            {server.alias || server.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <ProgressBar percent={cpuPercent} />
          <span className="font-mono text-muted-foreground w-7 text-right flex-shrink-0 text-[11px] hidden sm:block">{cpuPercent}%</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 flex-1 min-w-0">
          <ProgressBar percent={memPercent} />
          <span className="font-mono text-muted-foreground w-7 text-right flex-shrink-0 text-[11px]">{memPercent}%</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 flex-1 min-w-0">
          <ProgressBar percent={diskPercent} />
          <span className="font-mono text-muted-foreground w-7 text-right flex-shrink-0 text-[11px]">{diskPercent}%</span>
        </div>

        <div className="hidden xl:block flex-1 min-w-0">
          <span className="font-mono text-muted-foreground text-[11px]" suppressHydrationWarning>
            {server.network_rx ? formatBytes(server.network_rx) + "/s" : "—"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-0.5 text-muted-foreground text-[11px]">
            <Clock className="h-3 w-3" />
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