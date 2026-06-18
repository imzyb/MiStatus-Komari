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
const PAD_T = 24;
const PAD_B = 20;
const INNER_W = 560;
const INNER_H = 224;
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

const ISP_ORDER = [1, 2, 3];
const TIMEOUT_VALUE = -1;
const AUTO_REFRESH_MS = 30_000;
const MAX_POINTS = 200;
const TICK_COUNT = 5;

function isTimeout(v: number): boolean {
  return v === TIMEOUT_VALUE || v < 0;
}

function computeNiceTicks(dataMax: number): number[] {
  const rawMax = Math.max(dataMax, 10);
  const rough = rawMax / TICK_COUNT;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / mag;
  let nice: number;
  if (residual <= 1.5) nice = 1;
  else if (residual <= 3.5) nice = 2;
  else if (residual <= 7.5) nice = 5;
  else nice = 10;
  const step = nice * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= rawMax + step * 0.01; v += step) ticks.push(Math.round(v));
  if (ticks[ticks.length - 1] < rawMax) ticks.push(Math.round(rawMax));
  return ticks;
}

function formatTickValue(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}s`;
  return `${v}`;
}

function formatTime(iso: string, showDate: boolean = false): string {
  try {
    const d = new Date(iso);
    const hm = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    if (showDate) return `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${hm}`;
    return hm;
  } catch { return ""; }
}

function formatValue(v: number): string {
  if (isTimeout(v)) return "超时";
  if (v >= 1000) return `${(v / 1000).toFixed(1)}s`;
  return `${Math.round(v)}ms`;
}

function latencyQuality(ms: number): "good" | "ok" | "bad" {
  if (ms < 50) return "good";
  if (ms < 200) return "ok";
  return "bad";
}

function qualityColor(q: "good" | "ok" | "bad"): string {
  if (q === "good") return "text-trading-up";
  if (q === "ok") return "text-accent";
  return "text-trading-down";
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

function samplePoints<T>(arr: T[]): T[] {
  if (arr.length <= MAX_POINTS) return arr;
  const step = Math.max(1, Math.floor(arr.length / MAX_POINTS));
  const result: T[] = [];
  for (let i = 0; i < arr.length; i += step) result.push(arr[i]);
  if (result[result.length - 1] !== arr[arr.length - 1]) result.push(arr[arr.length - 1]);
  return result;
}

export const PingChart: React.FC<PingChartProps> = React.memo(
  function PingChart({ serverId, livePing10010, livePing189, livePing10086 }) {
    const [result, setResult] = useState<PingRecordsResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hours, setHours] = useState(12);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const fetch = useCallback(async (h: number, isRefresh = false) => {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      try {
        const res = await rpcAdapter.getRecords({ type: "ping", uuid: serverId, hours: h });
        setResult(res as PingRecordsResult);
      } catch { /* ignore */ }
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }, [serverId]);

    useEffect(() => { fetch(hours); }, [fetch, hours]);
    useEffect(() => {
      const timer = setInterval(() => fetch(hours, true), AUTO_REFRESH_MS);
      return () => clearInterval(timer);
    }, [fetch, hours]);

    const handleRefresh = useCallback(() => fetch(hours, true), [fetch, hours]);

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
      for (const b of result.basic_info) {
        const id = Number(b.client);
        if (Number.isFinite(id)) map[id] = b;
      }
      return map;
    }, [result]);

    const taskIds = useMemo(() => ISP_ORDER.filter((id) => grouped[id]?.length > 0), [grouped]);
    const hasData = !loading && result && taskIds.length > 0;

    const sampled = useMemo(() => {
      const m: Record<number, { time: string; value: number }[]> = {};
      for (const id of taskIds) m[id] = samplePoints(grouped[id]);
      return m;
    }, [taskIds, grouped]);

    const sampledLen = useMemo(() => {
      return taskIds.reduce((m, id) => Math.max(m, sampled[id].length), 0);
    }, [taskIds, sampled]);

    const livePingMap = useMemo<Record<number, number | undefined>>(() => ({
      1: livePing10010,
      2: livePing189,
      3: livePing10086,
    }), [livePing10010, livePing189, livePing10086]);

    const timeLabels = useMemo(() => {
      if (taskIds.length === 0 || sampledLen === 0) return [];
      const pts = sampled[taskIds[0]];
      if (!pts) return [];
      const labels: { i: number; label: string }[] = [];
      const n = pts.length;
      const showDate = hours >= 24;
      const maxLabels = hours >= 48 ? 6 : hours >= 24 ? 7 : 8;
      const step = Math.max(Math.floor(n / maxLabels), 1);
      for (let idx = 0; idx < n; idx += step) labels.push({ i: idx, label: formatTime(pts[idx].time, showDate) });
      if (n > 1 && (n - 1) % step !== 0) labels.push({ i: n - 1, label: formatTime(pts[n - 1].time, showDate) });
      return labels;
    }, [taskIds, sampled, sampledLen, hours]);

    const yTicks = useMemo(() => {
      if (taskIds.length === 0) return { ticks: [0, 100], max: 100 };
      let dataMax = 0;
      for (const id of taskIds) {
        for (const p of grouped[id]) {
          if (!isTimeout(p.value)) dataMax = Math.max(dataMax, p.value);
        }
      }
      const hasTimeout = taskIds.some((id) => grouped[id].some((p) => isTimeout(p.value)));
      const ticks = computeNiceTicks(dataMax);
      const max = ticks[ticks.length - 1];
      if (hasTimeout) ticks.push(max + Math.max(Math.round(max * 0.2), 50));
      return { ticks, max: ticks[ticks.length - 1] };
    }, [taskIds, grouped]);

    const toX = (i: number, n: number) => PAD_L + (i / Math.max(n - 1, 1)) * INNER_W;
    const toY = (v: number): number => {
      if (isTimeout(v)) return PAD_T;
      const clamped = Math.min(Math.max(v, 0), yTicks.max);
      return PAD_T + INNER_H - (clamped / yTicks.max) * INNER_H;
    };

    const buildSmoothPath = (id: number): string => {
      const pts = sampled[id];
      if (!pts || pts.length < 2) return "";
      const n = pts.length;
      const coords = pts.map((p, i) => ({ x: toX(i, n), y: toY(p.value) }));
      let d = `M ${coords[0].x},${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        const p0 = coords[Math.max(i - 2, 0)];
        const p1 = coords[i - 1];
        const p2 = coords[i];
        const p3 = coords[Math.min(i + 1, coords.length - 1)];
        const t = 0.18;
        const cp1x = p1.x + (p2.x - p0.x) * t;
        const cp1y = p1.y + (p2.y - p0.y) * t;
        const cp2x = p2.x - (p3.x - p1.x) * t;
        const cp2y = p2.y - (p3.y - p1.y) * t;
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      }
      return d;
    };

    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || sampledLen === 0) return;
      const rect = svg.getBoundingClientRect();
      const xInPlot = ((e.clientX - rect.left) / rect.width) * CHART_W - PAD_L;
      if (xInPlot < 0 || xInPlot > INNER_W) { setHoverIdx(null); return; }
      const idx = Math.round((xInPlot / INNER_W) * (sampledLen - 1));
      setHoverIdx(Math.max(0, Math.min(idx, sampledLen - 1)));
    }, [sampledLen]);

    const handleMouseLeave = useCallback(() => setHoverIdx(null), []);

    const hoverItems = useMemo(() => {
      if (hoverIdx === null) return null;
      const results: { label: string; color: string; value: number; time: string }[] = [];
      for (const id of taskIds) {
        const pts = sampled[id];
        if (!pts || hoverIdx >= pts.length) continue;
        const cfg = TASK_CONFIG[id] || { label: `任务${id}`, color: "#888" };
        results.push({ label: cfg.label, color: cfg.color, value: pts[hoverIdx].value, time: pts[hoverIdx].time });
      }
      return results.length > 0 ? results : null;
    }, [hoverIdx, taskIds, sampled]);

    const allTaskIds = useMemo(() => Object.keys(grouped).map(Number).sort(), [grouped]);

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
              aria-label="刷新"
            >
              <RefreshCw className={`h-3 w-3 ${loading || refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {allTaskIds.map((id) => {
              const cfg = TASK_CONFIG[id] || { label: `任务${id}`, color: "#888" };
              const info = basicInfoMap[id];
              const pts = grouped[id];
              const liveVal = livePingMap[id];
              const histLastVal = pts && pts.length > 0 ? pts[pts.length - 1].value : null;
              const displayVal = liveVal !== undefined ? liveVal : (histLastVal ?? undefined);
              return (
                <div key={id} className="flex items-center gap-1.5 text-[11px]">
                  <PingDot color={cfg.color} value={displayVal} />
                  <span className="font-medium text-foreground/70">{cfg.label}</span>
                  {displayVal !== undefined && (
                    <span className={`font-mono font-medium ${isTimeout(displayVal) ? "text-trading-down" : qualityColor(latencyQuality(displayVal))}`}>
                      {formatValue(displayVal)}
                    </span>
                  )}
                  {info && (
                    <span className="text-muted-foreground font-mono text-[10px]">
                      {info.min.toFixed(0)}~{info.max.toFixed(0)}ms
                    </span>
                  )}
                  {liveVal !== undefined && (
                    <span className="h-1 w-1 rounded-full bg-trading-up animate-pulse ml-0.5" title="实时" />
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
            <span className="text-xs text-muted-foreground">加载中...</span>
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
            <defs>
              <clipPath id="chartArea">
                <rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} />
              </clipPath>
            </defs>

            <rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} fill="currentColor" fillOpacity="0.02" rx="2" />

            {yTicks.ticks.map((v) => {
              const y = toY(v);
              return (
                <g key={v}>
                  <line x1={PAD_L} x2={PAD_L + INNER_W} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="4 3" />
                  <text x={PAD_L - 6} y={y + 3} textAnchor="end" fill="currentColor" opacity="0.4" fontSize="9" fontFamily="monospace">
                    {formatTickValue(v)}
                  </text>
                </g>
              );
            })}

            {timeLabels.map((t, i) => (
              <text key={i} x={toX(t.i, sampledLen)} y={PAD_T + INNER_H + 14} textAnchor="middle" fill="currentColor" opacity="0.4" fontSize="8" fontFamily="monospace">{t.label}</text>
            ))}

            <g clipPath="url(#chartArea)">
            {taskIds.map((id) => {
              const cfg = TASK_CONFIG[id] || { label: "", color: "#888" };
              const pathD = buildSmoothPath(id);
              if (!pathD) return null;
              const pts = sampled[id];
              if (!pts) return null;
              const n = pts.length;
              const lastX = toX(n - 1, n);
              const lastY = toY(pts[n - 1].value);
              const lastVal = pts[n - 1].value;
              const labelX = lastX + 5 > PAD_L + INNER_W - 30 ? lastX - 5 : lastX + 5;
              const labelAnchor = lastX + 5 > PAD_L + INNER_W - 30 ? "end" : "start";
              const endColor = isTimeout(lastVal) ? "var(--trading-down, #ff3b30)" : cfg.color;
              return (
                <g key={id}>
                  <path d={pathD} fill="none" stroke={cfg.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  <circle cx={lastX} cy={lastY} r="3" fill={endColor} />
                  <text x={labelX} y={lastY + 3} textAnchor={labelAnchor} fill={endColor} fontSize="9" fontFamily="monospace" fontWeight="600">
                    {formatValue(lastVal)}
                  </text>
                </g>
              );
            })}
            </g>

            {hoverIdx !== null && hoverItems && (
              <>
                <line x1={toX(hoverIdx, sampledLen)} x2={toX(hoverIdx, sampledLen)} y1={PAD_T} y2={PAD_T + INNER_H} stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3 3" />
                {hoverItems.map((item, idx) => (
                  <circle key={idx} cx={toX(hoverIdx, sampledLen)} cy={toY(item.value)} r="3.5" fill={isTimeout(item.value) ? "var(--trading-down, #ff3b30)" : item.color} stroke="var(--background)" strokeWidth="2" />
                ))}
              </>
            )}

            {hoverIdx !== null && hoverItems && (() => {
              const cx = toX(hoverIdx, sampledLen);
              const timeStr = hoverItems[0]?.time ? formatTime(hoverItems[0].time, hours >= 24) : "";
              const boxW = 85;
              const boxH = 16 + hoverItems.length * 15;
              let bx = cx + 10;
              if (bx + boxW > PAD_L + INNER_W) bx = cx - boxW - 10;
              const by = PAD_T + 2;
              return (
                <g>
                  <rect x={bx} y={by} width={boxW} height={boxH} rx="4" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
                  <text x={bx + 6} y={by + 11} fontSize="8" fill="var(--muted-foreground)" fontFamily="monospace">{timeStr}</text>
                  {hoverItems.map((item, i) => (
                    <g key={i}>
                      <circle cx={bx + 10} cy={by + 18 + i * 15} r="3" fill={isTimeout(item.value) ? "var(--trading-down, #ff3b30)" : item.color} />
                      <text x={bx + 18} y={by + 21 + i * 15} fontSize="9" fill="var(--foreground)" fontFamily="monospace">
                        {item.label}{" "}
                      </text>
                      <text x={bx + 40} y={by + 21 + i * 15} fontSize="9" fontWeight="600" fontFamily="monospace" fill={isTimeout(item.value) ? "var(--trading-down, #ff3b30)" : item.color}>
                        {formatValue(item.value)}
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