"use client";

import React from "react";
import { Server } from "@/lib/api";
import {
  formatDurationEnShort,
  createCpuFormatter,
  createSwapFormatter,
  formatBytes,
} from "@/lib/utils";
import { ServerMetric } from "./server-metric";
import { Clock, MapPin, Server as ServerIcon } from "lucide-react";
import { useServerDetail } from "@/contexts/server-detail-context";

// 导入拆分后的组件
import {
  StatusIndicator,
  StatusBadge,
  RealTimeNetworkPanel,
  TotalTrafficPanel,
} from "./server";

interface ServerCardProps {
  server: Server;
}

export const ServerCard: React.FC<ServerCardProps> = React.memo(
    function ServerCard({ server }) {
    const isOnline = server.online;
    const { openDetail } = useServerDetail();

    const cpuFormatter = React.useMemo(
      () => createCpuFormatter("zh-CN", 1),
      []
    );

    const swapFormatter = React.useMemo(
      () => createSwapFormatter(server.swap_total),
      [server.swap_total]
    );

    const memoryFormatter = React.useCallback(
      (val: number) => formatBytes(val),
      []
    );
    const diskFormatter = React.useCallback(
      (val: number) => formatBytes(val),
      []
    );

    return (
      <div
        className="relative h-full server-card rounded-2xl bg-card border border-hairline/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
        onClick={() => openDetail(server)}
      >
        <ServerCardHeader server={server} isOnline={isOnline} />

        <div className="p-3.5 pt-0 space-y-2.5 flex-grow flex flex-col">
          <ServerMetric
            label="CPU"
            value={server.cpu}
            total={100}
            unit="%"
            formatter={cpuFormatter}
          />

          <ServerMetric
            label="内存"
            value={server.memory_used}
            total={server.memory_total}
            formatter={memoryFormatter}
          />

          <ServerMetric
            label="硬盘"
            value={server.hdd_used}
            total={server.hdd_total}
            formatter={diskFormatter}
          />

          <ServerMetric
            label="SWAP"
            value={server.swap_used}
            total={server.swap_total || 1}
            formatter={swapFormatter}
          />

          {/* 网络面板 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 mt-auto">
            <RealTimeNetworkPanel
              downloadSpeed={server.network_rx}
              uploadSpeed={server.network_tx}
            />

            <TotalTrafficPanel
              totalDownload={server.network_in}
              totalUpload={server.network_out}
            />
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 仅比较会影响 UI 的字段，避免昂贵的 JSON.stringify
    const a = prevProps.server;
    const b = nextProps.server;

    return (
      a.alias === b.alias &&
      a.name === b.name &&
      a.gid === b.gid &&
      a.type === b.type &&
      a.location === b.location &&
      a.uptime === b.uptime &&
      a.online === b.online &&
      a.online4 === b.online4 &&
      a.online6 === b.online6 &&
      a.cpu === b.cpu &&
      a.memory_total === b.memory_total &&
      a.memory_used === b.memory_used &&
      a.swap_total === b.swap_total &&
      a.swap_used === b.swap_used &&
      a.hdd_total === b.hdd_total &&
      a.hdd_used === b.hdd_used &&
      a.network_rx === b.network_rx &&
      a.network_tx === b.network_tx &&
      a.network_in === b.network_in &&
      a.network_out === b.network_out &&
      a.ping_10010 === b.ping_10010 &&
      a.ping_189 === b.ping_189 &&
      a.ping_10086 === b.ping_10086
    );
  }
);
ServerCard.displayName = "ServerCard";

// 服务器卡片头部组件 - 独立记忆化
interface ServerCardHeaderProps {
  server: Server;
  isOnline: boolean;
}

const ServerCardHeader: React.FC<ServerCardHeaderProps> = React.memo(
  function ServerCardHeader({ server, isOnline }) {
    return (
      <div className="p-3.5 pb-1.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 max-w-[80%]">
            <StatusIndicator isOnline={isOnline} />
            <h3 className="text-sm font-semibold truncate" suppressHydrationWarning>
              {server.alias || server.name}
            </h3>
          </div>
          <StatusBadge isOnline={isOnline} />
        </div>

        <div className="flex items-center justify-between">
          <UptimeDisplay uptime={server.uptime} />
          <div className="flex items-center gap-1 overflow-hidden">
            {server.type && <ServerTypeTag label={server.type} />}
            {server.location && <LocationTag label={server.location} />}
          </div>
        </div>
      </div>
    );
  }
);

// 运行时间显示组件
interface UptimeDisplayProps {
  uptime: string;
}

const UptimeDisplay: React.FC<UptimeDisplayProps> = React.memo(
  function UptimeDisplay({ uptime }) {
    // uptime 传入为 "{seconds}s" 或空字符串
    const human = React.useMemo(() => {
      if (!uptime) return "";
      const match = uptime.match(/^(\d+)s$/);
      if (!match) return uptime;
      const seconds = parseInt(match[1], 10);
      return formatDurationEnShort(seconds, 3);
    }, [uptime]);
    return (
      <span
        className="inline-flex items-center text-muted-foreground text-xs whitespace-nowrap"
        title={human}
      >
        <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground/60" />
        <span suppressHydrationWarning>{human || "—"}</span>
      </span>
    );
  }
);
UptimeDisplay.displayName = "UptimeDisplay";

// 服务器类型标签
const ServerTypeTag: React.FC<{ label: string }> = React.memo(
  function ServerTypeTag({ label }) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground whitespace-nowrap">
        <ServerIcon className="h-2.5 w-2.5" />
        <span className="truncate max-w-[5rem]" suppressHydrationWarning>{label}</span>
      </span>
    );
  }
);
ServerTypeTag.displayName = "ServerTypeTag";

const LocationTag: React.FC<{ label: string }> = React.memo(
  function LocationTag({ label }) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground whitespace-nowrap">
        <MapPin className="h-2.5 w-2.5" />
        <span className="truncate max-w-[7rem]" suppressHydrationWarning>{label}</span>
      </span>
    );
  }
);
LocationTag.displayName = "LocationTag";
