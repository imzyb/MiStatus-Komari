"use client";

import React from "react";
import { Server } from "@/lib/api";
import {
  formatBytes,
  formatPercent,
  formatUptime,
  getThresholdColor,
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
  const colors = getThresholdColor(percent);
  return (
    <div className="w-12 sm:w-12 h-1.5 rounded-full bg-muted overflow-hidden flex-shrink-0">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${colors.bar}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

const ServerListItem: React.FC<ServerListItemProps> = React.memo(
  function ServerListItem({ server }) {
    const { openDetail, showDetails } = useServerDetail();
    const isOnline = server.online;
    const cpuPercent = formatPercent(server.cpu, 100);
    const memPercent = formatPercent(server.memory_used, server.memory_total);
    const diskPercent = formatPercent(server.hdd_used, server.hdd_total);

    const uptime = React.useMemo(() => formatUptime(server.uptime, 2), [server.uptime]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (showDetails && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        openDetail(server);
      }
    }, [showDetails, openDetail, server]);

    return (
      <div
        className={
          "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-card shadow-sm transition-all duration-200 text-xs" +
          (showDetails ? " hover:shadow-md active:scale-[0.99] cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none" : "")
        }
        onClick={showDetails ? () => openDetail(server) : undefined}
        onKeyDown={handleKeyDown}
        role={showDetails ? "button" : undefined}
        tabIndex={showDetails ? 0 : undefined}
        aria-label={showDetails ? `查看 ${server.alias || server.name} 详情` : undefined}
      >
        <div className="flex items-center gap-2 min-w-0 w-[35%] sm:w-[25%]">
          <StatusIndicator isOnline={isOnline} />
          <span className="font-medium text-foreground truncate text-[11px]" suppressHydrationWarning>
            {server.alias || server.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0 w-[25%] sm:w-[15%]">
          <ProgressBar percent={cpuPercent} />
          <span className="font-mono text-muted-foreground w-7 text-right flex-shrink-0 text-[11px] hidden sm:block">{cpuPercent}%</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 min-w-0 w-[15%]">
          <ProgressBar percent={memPercent} />
          <span className="font-mono text-muted-foreground w-7 text-right flex-shrink-0 text-[11px]">{memPercent}%</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 min-w-0 w-[15%]">
          <ProgressBar percent={diskPercent} />
          <span className="font-mono text-muted-foreground w-7 text-right flex-shrink-0 text-[11px]">{diskPercent}%</span>
        </div>

        <div className="hidden xl:block min-w-0 w-[15%]">
          <div className="font-mono text-muted-foreground text-[11px] space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="text-trading-down">↓</span>
              <span>{formatBytes(server.network_in)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-trading-up">↑</span>
              <span>{formatBytes(server.network_out)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <div className="flex items-center gap-1 text-muted-foreground text-[11px] whitespace-nowrap">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span suppressHydrationWarning>{uptime}</span>
          </div>
          <div className="w-[36px] sm:w-[40px] flex justify-end">
            <StatusBadge isOnline={isOnline} />
          </div>
        </div>
      </div>
    );
  }
);
ServerListItem.displayName = "ServerListItem";

export { ServerListItem };