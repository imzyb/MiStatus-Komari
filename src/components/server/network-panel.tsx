"use client";

import React from "react";
import { Wifi, HardDrive } from "lucide-react";
import { formatBytes, formatSpeed } from "@/lib/utils";
import { TrafficArrow } from "@/components/shared/traffic-arrow";

interface PanelHeaderProps {
  icon: React.ReactNode;
  label: string;
}

const PanelHeader: React.FC<PanelHeaderProps> = React.memo(
  function PanelHeader({ icon, label }) {
    return (
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
    );
  }
);
PanelHeader.displayName = "PanelHeader";

interface PanelRowProps {
  arrow: React.ReactNode;
  label: string;
  value: string;
}

const PanelRow: React.FC<PanelRowProps> = React.memo(
  function PanelRow({ arrow, label, value }) {
    return (
      <div className="flex items-center text-xs leading-5">
        <span className="flex-shrink-0 text-muted-foreground">{arrow}</span>
        <span className="font-medium ml-1 w-6 flex-shrink-0">{label}</span>
        <span className="font-medium text-muted-foreground font-mono whitespace-nowrap ml-auto" suppressHydrationWarning>
          {value}
        </span>
      </div>
    );
  }
);
PanelRow.displayName = "PanelRow";

interface RealTimeNetworkPanelProps {
  downloadSpeed: number;
  uploadSpeed: number;
}

export const RealTimeNetworkPanel: React.FC<RealTimeNetworkPanelProps> =
  React.memo(function RealTimeNetworkPanel({ downloadSpeed, uploadSpeed }) {
    const formattedDownload = React.useMemo(
      () => formatSpeed(downloadSpeed, 1), [downloadSpeed]
    );
    const formattedUpload = React.useMemo(
      () => formatSpeed(uploadSpeed, 1), [uploadSpeed]
    );

    return (
      <div className="p-2.5 rounded-xl bg-secondary flex flex-col h-full">
        <PanelHeader icon={<Wifi className="h-3.5 w-3.5" />} label="实时网络" />
        <div className="flex-1 flex flex-col justify-center space-y-1">
          <PanelRow
            arrow={<TrafficArrow direction="down" className="text-sm" />}
            label="下载" value={formattedDownload}
          />
          <PanelRow
            arrow={<TrafficArrow direction="up" className="text-sm" />}
            label="上传" value={formattedUpload}
          />
        </div>
      </div>
    );
  });

interface TotalTrafficPanelProps {
  totalDownload: number;
  totalUpload: number;
}

export const TotalTrafficPanel: React.FC<TotalTrafficPanelProps> = React.memo(
  function TotalTrafficPanel({ totalDownload, totalUpload }) {
    const formattedDownload = React.useMemo(
      () => formatBytes(totalDownload, 1), [totalDownload]
    );
    const formattedUpload = React.useMemo(
      () => formatBytes(totalUpload, 1), [totalUpload]
    );

    return (
      <div className="p-2.5 rounded-xl bg-secondary flex flex-col h-full">
        <PanelHeader icon={<HardDrive className="h-3.5 w-3.5" />} label="总流量" />
        <div className="flex-1 flex flex-col justify-center space-y-1">
          <PanelRow
            arrow={<TrafficArrow direction="down" className="text-sm" />}
            label="接收" value={formattedDownload}
          />
          <PanelRow
            arrow={<TrafficArrow direction="up" className="text-sm" />}
            label="发送" value={formattedUpload}
          />
        </div>
      </div>
    );
  }
);