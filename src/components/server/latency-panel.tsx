import React from "react";
import { Activity } from "lucide-react";

interface LatencyPanelProps {
  ping10010?: number;
  ping189?: number;
  ping10086?: number;
  loading?: boolean;
}

const MAX_LATENCY_DISPLAY = 500;
const TIMEOUT_VALUE = -1;

function isTimeout(ms: number | undefined): boolean {
  return ms !== undefined && (ms === TIMEOUT_VALUE || ms < 0);
}

function qualityColor(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "bg-muted-foreground/20";
  if (isTimeout(ms)) return "bg-trading-down";
  if (ms < 50) return "bg-trading-up";
  if (ms < 150) return "bg-accent";
  return "bg-trading-down";
}

function qualityTextColor(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "text-muted-foreground";
  if (isTimeout(ms)) return "text-trading-down";
  if (ms < 50) return "text-trading-up";
  if (ms < 150) return "text-accent";
  return "text-trading-down";
}

function barWidth(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "0%";
  if (isTimeout(ms)) return "100%";
  return `${Math.min((ms / MAX_LATENCY_DISPLAY) * 100, 100)}%`;
}

function formatLatency(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "—";
  if (isTimeout(ms)) return "超时";
  return `${ms.toFixed(0)}`;
}

const LATENCY_ITEMS = [
  { key: "ping10010" as const, label: "联通" },
  { key: "ping189" as const, label: "电信" },
  { key: "ping10086" as const, label: "移动" },
] as const;

function SkeletonBar() {
  return (
    <div className="flex items-center gap-1.5 text-xs leading-5">
      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/10 skeleton" />
      <span className="text-muted-foreground w-8 flex-shrink-0 skeleton rounded">&nbsp;</span>
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden mx-1 skeleton" />
      <span className="font-mono w-10 text-right flex-shrink-0 skeleton rounded">&nbsp;</span>
    </div>
  );
}

export const LatencyPanel: React.FC<LatencyPanelProps> = React.memo(
  function LatencyPanel({ ping10010, ping189, ping10086, loading }) {
    const values = { ping10010, ping189, ping10086 };
    const hasAny = ping10010 !== undefined || ping189 !== undefined || ping10086 !== undefined;

    return (
      <div className="p-3 rounded-2xl bg-card border border-hairline/70 shadow-sm">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">延迟</span>
          {hasAny && <span className="h-1.5 w-1.5 rounded-full bg-trading-up animate-pulse ml-auto" title="实时" />}
        </div>
        <div className="space-y-1">
          {loading ? (
            <>
              <SkeletonBar />
              <SkeletonBar />
              <SkeletonBar />
            </>
          ) : hasAny ? (
            LATENCY_ITEMS.map(({ key, label }) => {
              const val = values[key];
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs leading-5">
                  <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${qualityColor(val)}`} />
                  <span className="text-muted-foreground w-8 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden mx-1">
                    <div
                      className={`h-full rounded-full ${qualityColor(val)} transition-[width] duration-300`}
                      style={{ width: barWidth(val) }}
                    />
                  </div>
                  <span className={`font-mono w-10 text-right flex-shrink-0 font-medium ${qualityTextColor(val)} ${isTimeout(val) ? "text-trading-down" : ""}`}>
                    {formatLatency(val)}
                  </span>
                  {val !== undefined && !isTimeout(val) && (
                    <span className="h-1 w-1 rounded-full bg-trading-up animate-pulse flex-shrink-0" title="实时" />
                  )}
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