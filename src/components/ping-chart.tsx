"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { rpcAdapter } from "@/lib/rpc-adapter";
import type { PingRecordsResult, BasicInfo } from "@/lib/rpc-types";

interface PingChartProps {
  serverId: string;
  livePing10010?: number;
  livePing189?: number;
  livePing10086?: number;
}

const PAD_L = 32;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 20;
const INNER_W = 560;
const INNER_H = 240;
const CHART_W = PAD_L + INNER_W + PAD_R;
const CHART_H = PAD_T + INNER_H + PAD_B;

const TIME_RANGES = [
  { hours: 6, label: "6H" },
  { hours: 12, label: "12H" },
  { hours: 24, label: "24H" },
  { hours: 48, label: "48H" },
] as const;

const TASK_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: "联通", color: "#00b578" },
  2: { label: "电信", color: "#ff6a00" },
  3: { label: "移动", color: "#ff3b30" },
};

const Y_TICKS = [0, 50, 100, 200, 400, 800, 1600];
const TIMEOUT_VALUE = -1;
const MAX_Y = 1600;
const AUTO_REFRESH_MS = 30_000;

function isTimeout(v: number): boolean {
  return v === TIMEOUT_VALUE || v < 0;
}

function resolveY(v: number): number {
  if (isTimeout(v)) return MAX_Y;
  return Math.min(Math.max(v, 0), MAX_Y);
}

function formatTime(iso: string, showDate: boolean = false): string {
  try {
    const d = new Date(iso);
    const hm = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    if (showDate) {
      return `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${hm}`;
    }
    return hm;
  } catch { return ""; }
}

function formatValue(v: number): string {
  if (isTimeout(v)) return "超时";
  return `${v.toFixed(0)}ms`;
}

function PingDot({ color, value }: { color: string; value: number | undefined }) {
  if (value === undefined) return <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />;
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full ${isTimeout(value) ? "bg-trading-down" : ""}`}
      style={isTimeout(value) ? undefined : { backgroundColor: color }}
    />
  );
}

export const PingChart: React.FC<PingChartProps> = React.memo(
  function PingChart({ serverId, livePing10010, livePing189, livePing10086 }) {
    const [result, setResult] = useState<PingRecordsResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [hours, setHours] = useState(12);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const fetch = useCallback(async (h: number) => {
      setLoading(true);
      try {
        const res = await rpcAdapter.getRecords({ type: "ping", uuid: serverId, hours: h });
        setResult(res as PingRecordsResult);
      } catch { /* ignore */ }
      setLoading(false);
    }, [serverId]);

    useEffect(() => { fetch(hours); }, [fetch, hours]);

    useEffect(() => {
      const timer = setInterval(() => { fetch(hours); }, AUTO_REFRESH_MS);
      return () => clearInterval(timer);
    }, [fetch, hours]);

    const handleRefresh = useCallback(() => { fetch(hours); }, [fetch, hours]);

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

    const livePingMap: Record<number, number | undefined> = {
      1: livePing10010,
      2: livePing189,
      3: livePing10086,
    };

    const timeLabels = useMemo(() => {
      if (taskIds.length === 0 || maxPoints === 0) return [];
      const pts = grouped[taskIds[0]];
      if (!pts) return [];
      const labels: { i: number; label: string }[] = [];
      const n = pts.length;
      const showDate = hours >= 24;
      const maxLabels = hours >= 48 ? 6 : hours >= 24 ? 7 : 8;
      const step = Math.max(Math.floor(n / maxLabels), 1);
      for (let idx = 0; idx < n; idx += step) {
        labels.push({ i: idx, label: formatTime(pts[idx].time, showDate) });
      }
      if (n > 1 && (n - 1) % step !== 0) {
        labels.push({ i: n - 1, label: formatTime(pts[n - 1].time, showDate) });
      }
      return labels;
    }, [taskIds, grouped, maxPoints, hours]);

    const toX = (i: number, n: number) => PAD_L + (i / Math.max(n - 1, 1)) * INNER_W;

    const toY = (v: number): number => {
      const resolved = resolveY(v);
      for (let i = 0; i < Y_TICKS.length - 1; i++) {
        const lo = Y_TICKS[i];
        const hi = Y_TICKS[i + 1];
        if (resolved <= hi || i === Y_TICKS.length - 2) {
          const ratio = (resolved - lo) / (hi - lo);
          const segmentStart = (i / (Y_TICKS.length - 1)) * INNER_H;
          const segmentEnd = ((i + 1) / (Y_TICKS.length - 1)) * INNER_H;
          return PAD_T + INNER_H - (segmentStart + ratio * (segmentEnd - segmentStart));
        }
      }
      return PAD_T;
    };

    const toPolyline = (id: number) => {
      const pts = grouped[id];
      if (!pts || pts.length < 2) return "";
      return pts.map((p, i) => `${toX(i, pts.length)},${toY(p.value)}`).join(" ");
    };

    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || maxPoints === 0) return;
      const rect = svg.getBoundingClientRect();
      const xInPlot = ((e.clientX - rect.left) / rect.width) * CHART_W - PAD_L;
      if (xInPlot < 0 || xInPlot > INNER_W) { setHoverIdx(null); return; }
      const idx = Math.round((xInPlot / INNER_W) * (maxPoints - 1));
      setHoverIdx(Math.max(0, Math.min(idx, maxPoints - 1)));
    }, [maxPoints]);

    const handleMouseLeave = useCallback(() => setHoverIdx(null), []);

    const hoverItems = useMemo(() => {
      if (hoverIdx === null) return null;
      const results: { label: string; color: string; value: number; time: string }[] = [];
      for (const id of taskIds) {
        const pts = grouped[id];
        if (!pts || hoverIdx >= pts.length) continue;
        const cfg = TASK_CONFIG[id] || { label: `任务${id}`, color: "#888" };
        results.push({ label: cfg.label, color: cfg.color, value: pts[hoverIdx].value, time: pts[hoverIdx].time });
      }
      return results.length > 0 ? results : null;
    }, [hoverIdx, taskIds, grouped]);

    return (
      <div className="space-y-3">
        <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
          <div className="flex items-center gap-1">
            {TIME_RANGES.map((r) => (
              <button
                key={r.hours}
                type="button"
                onClick={() => setHours(r.hours)}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs rounded-full transition-all duration-200 ${
                  hours === r.hours
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              aria-label="刷新延迟数据"
              title="刷新延迟数据"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {taskIds.map((id) => {
              const cfg = TASK_CONFIG[id] || { label: `任务${id}`, color: "#888" };
              const info = basicInfoMap[id];
              const pts = grouped[id];
              const liveVal = livePingMap[id];
              const histLastVal = pts && pts.length > 0 ? pts[pts.length - 1].value : null;
              const displayVal = liveVal !== undefined ? liveVal : (histLastVal ?? undefined);
              return (
                <div key={id} className="flex items-center gap-1 text-[11px]">
                  <PingDot color={cfg.color} value={displayVal} />
                  <span className="font-medium text-foreground/70">{cfg.label}</span>
                  {displayVal !== undefined && (
                    <span className={`font-mono ${isTimeout(displayVal) ? "text-trading-down" : ""}`} style={isTimeout(displayVal) ? undefined : { color: cfg.color }}>
                      {formatValue(displayVal)}
                    </span>
                  )}
                  {liveVal !== undefined && (
                    <span className="h-1 w-1 rounded-full bg-trading-up animate-pulse ml-0.5" title="实时数据" />
                  )}
                  {info && info.loss > 0 && (
                    <span className="text-trading-down font-mono ml-0.5">丢{info.loss.toFixed(1)}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {loading && !result ? (
          <div className="flex flex-col items-center justify-center h-72 space-y-3">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">加载延迟数据...</span>
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-72 space-y-3 text-muted-foreground/50">
            <Activity className="h-6 w-6" />
            <span className="text-xs">暂无延迟数据</span>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            width="100%"
            className="w-full h-72"
            role="img"
            aria-label="延迟监测曲线图"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {Y_TICKS.map((v) => {
              const y = toY(v);
              return (
                <g key={v}>
                  <line x1={PAD_L} x2={PAD_L + INNER_W} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                  <text x={PAD_L - 6} y={y + 3} textAnchor="end" fill="currentColor" opacity="0.5" fontSize="9" fontFamily="monospace">
                    {v === MAX_Y ? "超时" : v}
                  </text>
                </g>
              );
            })}

            <rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H * 0.08} fill="var(--trading-down, #ff3b30)" opacity="0.04" />

            {timeLabels.map((t, i) => (
              <text key={i} x={toX(t.i, maxPoints)} y={PAD_T + INNER_H + 14} textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="8" fontFamily="monospace">{t.label}</text>
            ))}

            {taskIds.map((id) => {
              const cfg = TASK_CONFIG[id] || { label: "", color: "#888" };
              const pts = grouped[id];
              if (!pts || pts.length < 2) return null;
              const lastX = toX(pts.length - 1, pts.length);
              const lastY = toY(pts[pts.length - 1].value);
              const lastVal = pts[pts.length - 1].value;
              return (
                <g key={id}>
                  <polyline fill="none" stroke={cfg.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={toPolyline(id)} />
                  <circle cx={lastX} cy={lastY} r="3" fill={isTimeout(lastVal) ? "var(--trading-down, #ff3b30)" : cfg.color} />
                  <text x={lastX + 6} y={lastY + 3} fill={isTimeout(lastVal) ? "var(--trading-down, #ff3b30)" : cfg.color} fontSize="9" fontFamily="monospace" fontWeight="500">
                    {formatValue(lastVal)}
                  </text>
                </g>
              );
            })}

            {hoverIdx !== null && hoverItems && (
              <>
                <line x1={toX(hoverIdx, maxPoints)} x2={toX(hoverIdx, maxPoints)} y1={PAD_T} y2={PAD_T + INNER_H} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 3" />
                {hoverItems.map((item, idx) => (
                  <circle key={idx} cx={toX(hoverIdx, maxPoints)} cy={toY(item.value)} r="4" fill={isTimeout(item.value) ? "var(--trading-down, #ff3b30)" : item.color} stroke="white" strokeWidth="1.5" />
                ))}
              </>
            )}

            {hoverIdx !== null && hoverItems && (() => {
              const cx = toX(hoverIdx, maxPoints);
              const timeStr = hoverItems[0]?.time ? formatTime(hoverItems[0].time, hours >= 24) : "";
              const boxW = 90;
              const boxH = 18 + hoverItems.length * 16;
              let bx = cx + 12;
              if (bx + boxW > PAD_L + INNER_W) bx = cx - boxW - 12;
              const by = PAD_T + 2;
              return (
                <g>
                  <rect x={bx} y={by} width={boxW} height={boxH} rx="6" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
                  <text x={bx + 8} y={by + 13} fontSize="9" fill="var(--muted-foreground)" fontFamily="monospace">{timeStr}</text>
                  {hoverItems.map((item, i) => (
                    <g key={i}>
                      <rect x={bx + 8} y={by + 20 + i * 16 - 4} width="8" height="8" rx="2" fill={isTimeout(item.value) ? "var(--trading-down, #ff3b30)" : item.color} />
                      <text x={bx + 20} y={by + 20 + i * 16 + 3} fontSize="10" fill="var(--foreground)" fontFamily="monospace">
                        {item.label} {formatValue(item.value)}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
        )}
      </div>
    );
  }
);
PingChart.displayName = "PingChart";