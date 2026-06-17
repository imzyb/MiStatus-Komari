import React from "react";

interface LatencyPanelProps {
  ping10010?: number;
  ping189?: number;
  ping10086?: number;
}

function formatLatency(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "—";
  return `${ms.toFixed(0)} ms`;
}

const LATENCY_ITEMS = [
  { key: "ping10010" as const, label: "联通", dot: "bg-trading-up" },
  { key: "ping189" as const, label: "电信", dot: "bg-accent" },
  { key: "ping10086" as const, label: "移动", dot: "bg-trading-down" },
] as const;

export const LatencyPanel: React.FC<LatencyPanelProps> = React.memo(
  function LatencyPanel({ ping10010, ping189, ping10086 }) {
    const values = { ping10010, ping189, ping10086 };
    const hasAny = ping10010 !== undefined || ping189 !== undefined || ping10086 !== undefined;

    if (!hasAny) return null;

    return (
      <div className="p-2.5 rounded-xl bg-secondary h-full transition-colors duration-200 hover:bg-secondary/80">
        <div className="space-y-1">
          {LATENCY_ITEMS.map(({ key, label, dot }) => {
            const val = values[key];
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div className={`h-1.5 w-1.5 rounded-full ${val !== undefined ? dot : 'bg-muted-foreground/30'}`} />
                <span className="text-muted-foreground w-6 flex-shrink-0">{label}</span>
                <span className="font-mono text-foreground ml-auto">
                  {formatLatency(val)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
LatencyPanel.displayName = "LatencyPanel";