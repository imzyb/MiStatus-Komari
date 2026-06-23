"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { rpcAdapter } from "@/lib/rpc-adapter";
import type { PingRecordsResult, BasicInfo } from "@/lib/rpc-types";

interface TaskConfigItem {
  label: string;
  color: string;
}

interface PingChartProps {
  serverId: string;
  livePingMap?: Record<number, number | undefined>;
  taskConfig?: Record<number, TaskConfigItem>;
}

const DEFAULT_TASK_CONFIG: Record<number, TaskConfigItem> = {
  1: { label: "联通", color: "var(--trading-up, #34c759)" },
  2: { label: "电信", color: "var(--accent, #ff6a00)" },
  3: { label: "移动", color: "var(--trading-down, #ff3b30)" },
};

const ISP_ORDER = [1, 2, 3];
const TIMEOUT_VALUE = -1;
const AUTO_REFRESH_MS = 30_000;
const MAX_POINTS = 200;
const PAD_L = 40, PAD_R = 8, PAD_T = 24, PAD_B = 20;
const INNER_W = 560, INNER_H = 224;
const CHART_W = PAD_L + INNER_W + PAD_R;
const CHART_H = PAD_T + INNER_H + PAD_B;
const Y_TICKS = [0, 50, 100, 200, 400, 800, 1600];

const TIME_RANGES = [
  { hours: 6, label: "6H" }, { hours: 12, label: "12H" },
  { hours: 24, label: "24H" }, { hours: 48, label: "48H" },
] as const;

function isTimeout(v: number): boolean { return v === TIMEOUT_VALUE || v < 0; }

function formatValue(v: number): string {
  if (isTimeout(v)) return "超时";
  return `${v}ms`;
}

function latencyQuality(ms: number): string {
  if (ms < 50) return "text-trading-up";
  if (ms < 200) return "text-accent";
  return "text-trading-down";
}

function latencyQualityColor(ms: number): string {
  if (isTimeout(ms)) return "var(--trading-down, #ff3b30)";
  if (ms < 50) return "var(--trading-up, #34c759)";
  if (ms < 200) return "var(--accent, #ff6a00)";
  return "var(--trading-down, #ff3b30)";
}

function PingDot({ color, value }: { color: string; value: number | undefined }) {
  if (value === undefined) return <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />;
  if (isTimeout(value)) return <span className="h-1.5 w-1.5 rounded-full bg-trading-down" />;
  return <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />;
}

function samplePointsMax(points: { time: string; value: number }[]): { time: string; value: number }[] {
  if (points.length <= MAX_POINTS) return points;
  const step = Math.max(1, Math.floor(points.length / MAX_POINTS));
  const result: { time: string; value: number }[] = [];
  for (let i = 0; i < points.length; i += step) {
    const end = Math.min(i + step, points.length);
    let selectedIdx = i;
    let hasTimeout = false;
    
    // 优先保留可能存在的超时/丢包点，防止被正常网络延迟数据覆盖
    for (let j = i; j < end; j++) {
      if (isTimeout(points[j].value)) {
        selectedIdx = j;
        hasTimeout = true;
        break;
      }
    }
    
    if (!hasTimeout) {
      let maxV = -Infinity;
      for (let j = i; j < end; j++) {
        if (points[j].value > maxV) {
          maxV = points[j].value;
          selectedIdx = j;
        }
      }
    }
    
    result.push(points[selectedIdx]);
  }
  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1]);
  }
  return result;
}

function TooltipContent({ hoverIdx, taskIds, sampled, taskConfig: tcfg, padL, padT, innerW, sampledLen }
: {
  hoverIdx: number;
  taskIds: number[];
  sampled: Record<number, { time: string; value: number }[]>;
  taskConfig: Record<number, TaskConfigItem>;
  padL: number;
  padT: number;
  innerW: number;
  sampledLen: number;
}) {
  const items = taskIds.map((id) => {
    const pts = sampled[id];
    const cfg = tcfg[id] || { label: `任务${id}`, color: "#888" };
    return pts && hoverIdx < pts.length
      ? { label: cfg.label, color: cfg.color, value: pts[hoverIdx].value }
      : null;
  }).filter(Boolean) as { label: string; color: string; value: number }[];

  if (items.length === 0) return null;

  const x = padL + (hoverIdx / Math.max(sampledLen - 1, 1)) * innerW;
  const boxW = 85, boxH = 16 + items.length * 15;
  let bx = x + 10;
  if (bx + boxW > padL + innerW) bx = x - boxW - 10;

  return (
    <g>
      <rect x={bx} y={padT + 2} width={boxW} height={boxH} rx="4" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
      <text x={bx + 6} y={padT + 13} fontSize="8" fill="var(--muted-foreground)" fontFamily="monospace">延迟</text>
      {items.map((item, i) => (
        <g key={i}>
          <circle cx={bx + 10} cy={padT + 20 + i * 15} r="3" fill={isTimeout(item.value) ? "var(--trading-down, #ff3b30)" : item.color} />
          <text x={bx + 18} y={padT + 23 + i * 15} fontSize="9" fill="var(--foreground)" fontFamily="monospace">
            {item.label} {formatValue(item.value)}
          </text>
        </g>
      ))}
    </g>
  );
}

export const PingChart: React.FC<PingChartProps> = React.memo(
  function PingChart({ serverId, livePingMap, taskConfig }) {
    const tcfg = useMemo(() => ({ ...DEFAULT_TASK_CONFIG, ...taskConfig }), [taskConfig]);

    const [result, setResult] = useState<PingRecordsResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hours, setHours] = useState(12);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const clipId = React.useId();

    const fetch = useCallback(async (h: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await rpcAdapter.getRecords({ type: "ping", uuid: serverId, hours: h });
        setResult(res as PingRecordsResult);
      } catch (e) {
        setError(e instanceof Error ? e.message : "获取延迟记录失败");
      }
      setLoading(false);
    }, [serverId]);

    const hoursRef = React.useRef(hours);
    hoursRef.current = hours;

    useEffect(() => { fetch(hours); }, [fetch, hours]);
    useEffect(() => {
      const timer = setInterval(() => fetch(hoursRef.current), AUTO_REFRESH_MS);
      return () => clearInterval(timer);
    }, [fetch]);

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
      for (const b of result.basic_info) { const id = Number(b.client); if (Number.isFinite(id)) map[id] = b; }
      return map;
    }, [result]);

    const taskIds = useMemo(() => ISP_ORDER.filter((id) => (grouped[id]?.length ?? 0) > 0), [grouped]);
    const hasData = !loading && !error && result && taskIds.length > 0;

    const sampled = useMemo(() => {
      const m: Record<number, { time: string; value: number }[]> = {};
      for (const id of taskIds) m[id] = samplePointsMax(grouped[id]);
      return m;
    }, [taskIds, grouped]);

    const sampledLen = useMemo(() => taskIds.reduce((m, id) => Math.max(m, sampled[id]?.length ?? 0), 0), [taskIds, sampled]);

    const livePingResolved = useMemo<Record<number, number | undefined>>(() => livePingMap ?? {}, [livePingMap]);

    const timeLabels = useMemo(() => {
      if (taskIds.length === 0 || sampledLen === 0) return [];
      const pts = sampled[taskIds[0]];
      if (!pts) return [];
      const labels: { i: number; label: string }[] = [];
      const n = pts.length, showDate = hours >= 24;
      const maxLabels = hours >= 48 ? 6 : hours >= 24 ? 7 : 8;
      const step = Math.max(Math.floor(n / maxLabels), 1);
      for (let idx = 0; idx < n; idx += step) {
        const d = new Date(pts[idx].time);
        const hm = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
        labels.push({ i: idx, label: showDate ? `${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")} ${hm}` : hm });
      }
      if (n > 1 && (n - 1) % step !== 0) {
        const d = new Date(pts[n-1].time);
        const hm = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
        labels.push({ i: n - 1, label: showDate ? `${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")} ${hm}` : hm });
      }
      return labels;
    }, [taskIds, sampled, sampledLen, hours]);

    const toX = (i: number, n: number) => PAD_L + (i / Math.max(n - 1, 1)) * INNER_W;
    const toY = (v: number): number => {
      if (isTimeout(v)) return PAD_T;
      return PAD_T + INNER_H - (Math.min(Math.max(v, 0), Y_TICKS[Y_TICKS.length - 1]) / Y_TICKS[Y_TICKS.length - 1]) * INNER_H;
    };

    const paths = useMemo(() => {
      const pathResult: Record<number, string> = {};
      const yMin = PAD_T;
      const yMax = PAD_T + INNER_H;
      const limitY = (y: number) => Math.min(yMax, Math.max(yMin, y));

      for (const id of taskIds) {
        const pts = sampled[id];
        if (!pts || pts.length < 2) continue;
        const coords = pts.map((p, i) => ({ x: toX(i, pts.length), y: toY(p.value) }));
        let d = `M ${coords[0].x},${coords[0].y}`;
        for (let i = 1; i < coords.length; i++) {
          const p0 = coords[Math.max(i - 2, 0)], p1 = coords[i - 1], p2 = coords[i], p3 = coords[Math.min(i + 1, coords.length - 1)];
          const t = 0.18;
          const cp1x = p1.x + (p2.x - p0.x) * t;
          const cp1y = limitY(p1.y + (p2.y - p0.y) * t);
          const cp2x = p2.x - (p3.x - p1.x) * t;
          const cp2y = limitY(p2.y - (p3.y - p1.y) * t);
          d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }
        pathResult[id] = d;
      }
      return pathResult;
    }, [taskIds, sampled]);

    const hoverAt = useCallback((clientX: number) => {
      const svg = svgRef.current;
      if (!svg || sampledLen === 0) return;
      const rect = svg.getBoundingClientRect();
      const xInPlot = ((clientX - rect.left) / rect.width) * CHART_W - PAD_L;
      if (xInPlot < 0 || xInPlot > INNER_W) { setHoverIdx(null); return; }
      setHoverIdx(Math.max(0, Math.min(Math.round((xInPlot / INNER_W) * (sampledLen - 1)), sampledLen - 1)));
    }, [sampledLen]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => hoverAt(e.clientX), [hoverAt]);
    const handleTouchMove = useCallback((e: React.TouchEvent) => { if (e.touches.length > 0) { e.preventDefault(); hoverAt(e.touches[0].clientX); } }, [hoverAt]);
    const handleMouseLeave = useCallback(() => setHoverIdx(null), []);

    const allTaskIds = useMemo(() => Object.keys(grouped).map(Number).sort(), [grouped]);

    if (loading && !result) {
      return (
        <div className="flex flex-col items-center justify-center h-72 space-y-3">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground">加载中...</span>
        </div>
      );
    }

    if (error && !result) {
      return (
        <div className="flex flex-col items-center justify-center h-72 space-y-3">
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
            <Activity className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">加载失败</span>
          <button type="button" onClick={() => fetch(hours)}
            className="text-xs text-primary underline-offset-2 hover:underline">
            点击重试
          </button>
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className="flex flex-col items-center justify-center h-72 space-y-3 text-muted-foreground/50">
          <Activity className="h-6 w-6" />
          <span className="text-xs">暂无延迟数据</span>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {TIME_RANGES.map((r) => (
              <button key={r.hours} type="button" onClick={() => setHours(r.hours)}
                aria-pressed={hours === r.hours}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs rounded-full transition-all duration-200 ${hours === r.hours ? "bg-primary text-primary-foreground font-medium shadow-sm" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}>
                {r.label}
              </button>
            ))}
            <button type="button" onClick={() => fetch(hours)} disabled={loading}
              aria-label="刷新"
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {allTaskIds.map((id) => {
              const cfg = tcfg[id] || { label: `任务${id}`, color: "#888" };
              const info = basicInfoMap[id];
              const liveVal = livePingResolved[id];
              const pts = grouped[id];
              const lastVal = liveVal !== undefined ? liveVal : (pts && pts.length > 0 ? pts[pts.length - 1].value : undefined);
              return (
                <div key={id} className="flex items-center gap-1 text-[11px]">
                  <PingDot color={cfg.color} value={lastVal} />
                  <span className="font-medium text-foreground/70">{cfg.label}</span>
                  {lastVal !== undefined && (
                    <span className={`font-mono font-medium ${isTimeout(lastVal) ? "text-trading-down" : latencyQuality(lastVal)}`}>{formatValue(lastVal)}</span>
                  )}
                  {info && <span className="text-muted-foreground font-mono text-[10px]">{info.min.toFixed(0)}~{info.max.toFixed(0)}ms</span>}
                  {liveVal !== undefined && <span className="h-1 w-1 rounded-full bg-trading-up animate-pulse ml-0.5" title="实时" />}
                </div>
              );
            })}
          </div>
        </div>

        <svg ref={svgRef} viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" className="w-full h-72 touch-none" role="img" aria-label="延迟监测曲线图"
          onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onTouchMove={handleTouchMove} onTouchEnd={handleMouseLeave}>
          <defs>
            <clipPath id={clipId}><rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} /></clipPath>
          </defs>
          <rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} fill="currentColor" fillOpacity="0.015" rx="2" />
          <rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" rx="2" />

          {Y_TICKS.map((v) => {
            const y = toY(v);
            return (
              <g key={v}>
                <line x1={PAD_L} x2={PAD_L + INNER_W} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="4 3" />
                <text x={PAD_L - 6} y={y + 3} textAnchor="end" fill="currentColor" opacity="0.4" fontSize="9" fontFamily="monospace">{v}</text>
              </g>
            );
          })}

          {timeLabels.map((t, i) => (
            <text key={i} x={toX(t.i, sampledLen)} y={PAD_T + INNER_H + 14} textAnchor="middle" fill="currentColor" opacity="0.4" fontSize="8" fontFamily="monospace">{t.label}</text>
          ))}

          <g clipPath={`url(#${clipId})`}>
            {taskIds.map((id) => {
              const cfg = tcfg[id] || { label: "", color: "#888" };
              const pathD = paths[id];
              if (!pathD) return null;
              const pts = sampled[id];
              if (!pts) return null;
              const lastX = toX(pts.length - 1, pts.length);
              const lastY = toY(pts[pts.length - 1].value);
              const lastVal = pts[pts.length - 1].value;
              const statusColor = latencyQualityColor(lastVal);
              const labelX = lastX + 5 > PAD_L + INNER_W - 30 ? lastX - 5 : lastX + 5;
              const labelAnchor = lastX + 5 > PAD_L + INNER_W - 30 ? "end" : "start";
              return (
                <g key={id}>
                  <path d={pathD} fill="none" stroke={cfg.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  <circle cx={lastX} cy={lastY} r="3.5" fill={statusColor} stroke="var(--background)" strokeWidth="1" />
                  <text x={labelX} y={lastY + 3} textAnchor={labelAnchor} fill={statusColor} fontSize="9" fontFamily="monospace" fontWeight="600">
                    {formatValue(lastVal)}
                  </text>
                </g>
              );
            })}
          </g>

          {hoverIdx !== null && (
            <>
              <line x1={toX(hoverIdx, sampledLen)} x2={toX(hoverIdx, sampledLen)} y1={PAD_T} y2={PAD_T + INNER_H} stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3 3" />
              {taskIds.map((id) => {
                const pts = sampled[id];
                if (!pts || hoverIdx >= pts.length) return null;
                const val = pts[hoverIdx].value;
                const cfg = tcfg[id] || { color: "#888" };
                return (
                  <circle key={id} cx={toX(hoverIdx, sampledLen)} cy={toY(val)} r="3.5"
                    fill={isTimeout(val) ? "var(--trading-down, #ff3b30)" : cfg.color} stroke="var(--background)" strokeWidth="2" />
                );
              })}
              <TooltipContent
                hoverIdx={hoverIdx}
                taskIds={taskIds}
                sampled={sampled}
                taskConfig={tcfg}
                padL={PAD_L}
                padT={PAD_T}
                innerW={INNER_W}
                sampledLen={sampledLen}
              />
            </>
          )}
        </svg>
      </div>
    );
  }
);
PingChart.displayName = "PingChart";