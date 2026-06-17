"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Activity } from "lucide-react";
import { rpcAdapter } from "@/lib/rpc-adapter";
import type { PingRecordsResult, BasicInfo } from "@/lib/rpc-types";

interface PingChartProps {
  serverId: string;
}

const CHART_W = 600;
const CHART_H = 160;
const BAR_GAP = 2;

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

    const maxPoints = useMemo(() => {
      return taskIds.reduce((m, id) => Math.max(m, grouped[id].length), 0);
    }, [taskIds, grouped]);

    const globalMax = useMemo(() => {
      let mx = 10;
      for (const id of taskIds) {
        for (const p of grouped[id]) mx = Math.max(mx, Math.min(p.value, MAX_PING_DISPLAY));
      }
      return mx;
    }, [taskIds, grouped]);

    const barW = useMemo(() => {
      if (maxPoints <= 0 || taskIds.length <= 0) return 4;
      const totalW = CHART_W;
      const groupW = totalW / Math.max(maxPoints, 1);
      const barW = Math.max((groupW - BAR_GAP * (taskIds.length - 1)) / taskIds.length, 2);
      return Math.min(barW, 12);
    }, [maxPoints, taskIds]);

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
                    <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: cfg.color }} />
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

            {/* 直方图 */}
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              className="w-full h-32"
              role="img"
              aria-label="延迟监测直方图"
            >
              {/* 网格线 */}
              {[0, 25, 50, 75, 100].map((pct) => (
                <line
                  key={pct}
                  x1="0" x2={CHART_W}
                  y1={(pct / 100) * CHART_H}
                  y2={(pct / 100) * CHART_H}
                  stroke="currentColor"
                  strokeOpacity="0.05"
                  strokeWidth="1"
                />
              ))}
              {/* 柱状图 */}
              {taskIds.map((id, tIdx) => {
                const cfg = TASK_CONFIG[id] || { label: "", color: "#888" };
                const pts = grouped[id];
                if (!pts || pts.length === 0) return null;
                const groupW = CHART_W / Math.max(maxPoints, 1);
                return pts.map((p, i) => {
                  const v = Math.min(p.value, MAX_PING_DISPLAY);
                  const barH = Math.max((v / globalMax) * CHART_H, 1);
                  const x = i * groupW + tIdx * (barW + BAR_GAP);
                  const y = CHART_H - barH;
                  return (
                    <rect
                      key={`${id}-${i}`}
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      fill={cfg.color}
                      opacity="0.75"
                      rx="1"
                    />
                  );
                });
              })}
            </svg>
          </>
        )}
      </div>
    );
  }
);
PingChart.displayName = "PingChart";