"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Activity } from "lucide-react";
import { rpcAdapter } from "@/lib/rpc-adapter";
import type { PingRecordsResult, BasicInfo } from "@/lib/rpc-types";

interface PingChartProps {
  serverId: string;
}

const CHART_W = 600;
const CHART_H = 180;

const TIME_RANGES = [
  { hours: 1, label: "1H" },
  { hours: 6, label: "6H" },
  { hours: 12, label: "12H" },
  { hours: 24, label: "24H" },
] as const;

const TASK_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: "联通", color: "#00b578" },
  2: { label: "电信", color: "#ff6a00" },
  3: { label: "移动", color: "#ff3b30" },
};

const MAX_PING_DISPLAY = 500;

export const PingChart: React.FC<PingChartProps> = React.memo(
  function PingChart({ serverId }) {
    const [result, setResult] = useState<PingRecordsResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [hours, setHours] = useState(6);

    const fetch = useCallback(async (h: number) => {
      setLoading(true);
      try {
        const res = await rpcAdapter.getRecords({ type: "ping", uuid: serverId, hours: h });
        setResult(res as PingRecordsResult);
      } catch { /* ignore */ }
      setLoading(false);
    }, [serverId]);

    useEffect(() => { fetch(hours); }, [fetch, hours]);

    const grouped = useMemo(() => {
      if (!result?.records) return {};
      const map: Record<number, { time: string; value: number }[]> = {};
      for (const r of result.records) {
        if (!map[r.task_id]) map[r.task_id] = [];
        map[r.task_id].push({ time: r.time, value: r.value });
      }
      return map;
    }, [result]);

    const basicInfoMap = useMemo(() => {
      if (!result?.basic_info) return {};
      const map: Record<number, BasicInfo> = {};
      for (const b of result.basic_info) map[b.client as unknown as number] = b;
      return map;
    }, [result]);

    const taskIds = Object.keys(grouped).map(Number).sort();
    const hasData = !loading && result && taskIds.length > 0;

    const allClamped = useMemo(() => {
      const m: Record<number, { v: number }[]> = {};
      for (const id of taskIds) {
        m[id] = grouped[id].map((p) => ({ v: Math.min(p.value, MAX_PING_DISPLAY) }));
      }
      return m;
    }, [taskIds, grouped]);

    const globalMax = useMemo(() => {
      let mx = 10;
      for (const pts of Object.values(allClamped)) {
        for (const p of pts) mx = Math.max(mx, p.v);
      }
      return mx;
    }, [allClamped]);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.hours}
              type="button"
              onClick={() => setHours(r.hours)}
              className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                hours === r.hours
                  ? "bg-primary text-primary-foreground font-medium shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">加载延迟数据...</span>
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-3 text-muted-foreground/50">
            <Activity className="h-8 w-8" />
            <span className="text-xs">暂无延迟数据</span>
          </div>
        ) : (
          <>
            {/* 图例 */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {taskIds.map((id) => {
                const cfg = TASK_CONFIG[id] || { label: `任务${id}`, color: "#888" };
                const info = basicInfoMap[id];
                return (
                  <div key={id} className="flex items-center gap-1.5 text-[11px]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="font-medium text-foreground/80">{cfg.label}</span>
                    {info && (
                      <span className="text-muted-foreground font-mono">
                        {info.min.toFixed(0)}/{info.max.toFixed(0)}ms
                        {info.loss > 0 && <span className="text-trading-down ml-0.5">丢{info.loss.toFixed(1)}%</span>}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 合并曲线图 */}
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              className="w-full h-28"
              role="img"
              aria-label="延迟监测合并曲线图"
            >
              {taskIds.map((id) => {
                const cfg = TASK_CONFIG[id] || { label: "", color: "#888" };
                const pts = allClamped[id];
                if (!pts || pts.length < 2) return null;
                const polyline = pts
                  .map((p, i) => {
                    const x = (i / Math.max(pts.length - 1, 1)) * CHART_W;
                    const y = ((globalMax - p.v) / globalMax) * CHART_H;
                    return `${x},${y}`;
                  })
                  .join(" ");
                return (
                  <polyline
                    key={id}
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={polyline}
                    opacity="0.85"
                  />
                );
              })}
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((pct) => (
                <line
                  key={pct}
                  x1="0" x2={CHART_W}
                  y1={(pct / 100) * CHART_H}
                  y2={(pct / 100) * CHART_H}
                  stroke="currentColor"
                  strokeOpacity="0.06"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </>
        )}
      </div>
    );
  }
);
PingChart.displayName = "PingChart";