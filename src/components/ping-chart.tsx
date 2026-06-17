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
const PAD_L = 35;
const PAD_R = 10;
const PAD_T = 18;
const PAD_B = 22;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

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

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } catch { return ""; }
}

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

    const globalMax = useMemo(() => {
      let mx = 10;
      for (const id of taskIds)
        for (const p of grouped[id]) mx = Math.max(mx, Math.min(p.value, MAX_PING_DISPLAY));
      return mx;
    }, [taskIds, grouped]);

    const maxPoints = useMemo(() => {
      return taskIds.reduce((m, id) => Math.max(m, grouped[id].length), 0);
    }, [taskIds, grouped]);

    const yTicks = useMemo(() => {
      const step = globalMax <= 50 ? 10 : globalMax <= 200 ? 50 : 100;
      const ticks: number[] = [];
      for (let v = 0; v <= globalMax; v += step) ticks.push(v);
      return ticks;
    }, [globalMax]);

    const timeLabels = useMemo(() => {
      if (taskIds.length === 0 || maxPoints === 0) return [];
      const pts = grouped[taskIds[0]];
      if (!pts) return [];
      const labels: { x: number; label: string }[] = [];
      const n = pts.length;
      const maxLabels = Math.min(n, 8);
      const step = Math.max(Math.floor(n / maxLabels), 1);
      for (let i = 0; i < n; i += step) {
        labels.push({ x: PAD_L + (i / Math.max(n - 1, 1)) * PLOT_W, label: formatTime(pts[i].time) });
      }
      if (n > 1 && (n - 1) % step !== 0) {
        labels.push({ x: PAD_L + PLOT_W, label: formatTime(pts[n - 1].time) });
      }
      return labels;
    }, [taskIds, grouped, maxPoints]);

    const toPolyline = (id: number) => {
      const pts = grouped[id];
      if (!pts || pts.length < 2) return "";
      return pts.map((p, i) => {
        const x = PAD_L + (i / (pts.length - 1)) * PLOT_W;
        const y = PAD_T + PLOT_H - (Math.min(p.value, MAX_PING_DISPLAY) / globalMax) * PLOT_H;
        return `${x},${y}`;
      }).join(" ");
    };

    return (
      <div className="space-y-3">
        {/* 时间选择（左） + ISP 图例（右）同一行 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {TIME_RANGES.map((r) => (
              <button
                key={r.hours}
                type="button"
                onClick={() => setHours(r.hours)}
                className={`px-2.5 py-1 text-xs rounded-full transition-all duration-200 ${
                  hours === r.hours
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-44 space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">加载延迟数据...</span>
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-44 space-y-3 text-muted-foreground/50">
            <Activity className="h-8 w-8" />
            <span className="text-xs">暂无延迟数据</span>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            width="100%"
            className="w-full h-44"
            role="img"
            aria-label="延迟监测曲线图"
          >
            {yTicks.map((v) => {
              const y = PAD_T + PLOT_H - (v / globalMax) * PLOT_H;
              return (
                <g key={v}>
                  <line x1={PAD_L} x2={CHART_W - PAD_R} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
                  <text x={PAD_L - 4} y={y + 3} textAnchor="end" fill="currentColor" opacity="0.35" fontSize="9" fontFamily="monospace">{v}</text>
                </g>
              );
            })}

            {taskIds.map((id) => {
              const cfg = TASK_CONFIG[id] || { label: "", color: "#888" };
              const pts = grouped[id];
              if (!pts || pts.length < 2) return null;
              const points = toPolyline(id);
              const areaPoints = `${PAD_L},${PAD_T + PLOT_H} ${points} ${PAD_L + PLOT_W},${PAD_T + PLOT_H}`;
              return (
                <g key={id}>
                  <defs>
                    <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cfg.color} stopOpacity="0.12" />
                      <stop offset="100%" stopColor={cfg.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={areaPoints} fill={`url(#area-${id})`} />
                  <polyline fill="none" stroke={cfg.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" points={points} />
                </g>
              );
            })}

            {timeLabels.map((t, i) => (
              <text key={i} x={t.x} y={CHART_H - 4} textAnchor="middle" fill="currentColor" opacity="0.35" fontSize="8" fontFamily="monospace">{t.label}</text>
            ))}
          </svg>
        )}
      </div>
    );
  }
);
PingChart.displayName = "PingChart";