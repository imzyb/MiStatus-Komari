import React from "react";
import { Activity } from "lucide-react";

interface LatencyPanelProps {
  ping10010?: number;
  ping189?: number;
  ping10086?: number;
}

const MAX_LATENCY_DISPLAY = 500;

function qualityColor(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "bg-muted-foreground/30";
  if (ms < 50) return "bg-trading-up";
  if (ms < 150) return "bg-accent";
  return "bg-trading-down";
}

function qualityTextColor(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "text-muted-foreground";
  if (ms < 50) return "text-trading-up";
  if (ms < 150) return "text-accent";
  return "text-trading-down";
}

function barWidth(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "0%";
  return `${Math.min((ms / MAX_LATENCY_DISPLAY) * 100, 100)}%`;
}

function formatLatency(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "—";
  return `${ms.toFixed(0)}`;
}

const LATENCY_ITEMS = [
  { key: "ping10010" as const, label: "联通" },
  { key: "ping189" as const, label: "电信" },
  { key: "ping10086" as const, label: "移动" },
] as const;

export const LatencyPanel: React.FC<LatencyPanelProps> = React.memo(
  function LatencyPanel({ ping10010, ping189, ping10086 }) {
    const values = { ping10010, ping189, ping10086 };
    const hasAny = ping10010 !== undefined || ping189 !== undefined || ping10086 !== undefined;

    return (
      <div className="p-2.5 rounded-xl bg-secondary flex flex-col h-full">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">延迟</span>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          {hasAny ? (
            LATENCY_ITEMS.map(({ key, label }) => {
              const val = values[key];
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs leading-5">
                  <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${qualityColor(val)}`} />
                  <span className="text-muted-foreground w-6 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1 rounded-full bg-background/50 overflow-hidden mx-1">
                    <div
                      className={`h-full rounded-full ${qualityColor(val)} transition-[width] duration-300`}
                      style={{ width: barWidth(val) }}
                    />
                  </div>
                  <span className={`font-mono w-8 text-right flex-shrink-0 font-medium ${qualityTextColor(val)}`}>
                    {formatLatency(val)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center text-xs text-muted-foreground/50 leading-5">
              无数据
            </div>
          )}
        </div>
      </div>
    );
  }
);
LatencyPanel.displayName = "LatencyPanel";