import React from "react";
import { formatBytes } from "@/lib/utils";
import { TrafficArrow } from "@/components/shared/traffic-arrow";

export interface TrafficDisplayProps {
  download: number;
  upload: number;
}

export const TrafficDisplay: React.FC<TrafficDisplayProps> = ({
  download,
  upload,
}) => {
  const formattedDownload = React.useMemo(() => formatBytes(download), [download]);
  const formattedUpload = React.useMemo(() => formatBytes(upload), [upload]);
  return (
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center">
      <TrafficArrow direction="down" className="text-sm mr-0.5 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground font-mono">{formattedDownload}</span>
    </div>
    <div className="h-4 w-[1px] mx-2 bg-border" />
    <div className="flex items-center">
      <TrafficArrow direction="up" className="text-sm mr-0.5 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground font-mono">{formattedUpload}</span>
    </div>
  </div>
  );
};