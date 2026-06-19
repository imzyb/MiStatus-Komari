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

const PAD_L = 32, PAD_R = 8, PAD_T = 24, PAD_B = 20;
const INNER_W = 560, INNER_H = 224;
const CHART_W = PAD_L + INNER_W + PAD_R;
const CHART_H = PAD_T + INNER_H + PAD_B;

const TIME_RANGES = [
  { hours: 6, label: "6H" }, { hours: 12, label: "12H" },
  { hours: 24, label: "24H" }, { hours: 48, label: "48H" },
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
const Y_TICKS = [0, 50, 100, 200, 400, 800, 1600];

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

function PingDot({ color, value }: { color: string; value: number | undefined }) {
  if (value === undefined) return <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />;
  if (isTimeout(value)) return <span className="h-1.5 w-1.5 rounded-full bg-trading-down" />;
  return <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />;
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
    const [hours, setHours] = useState(12);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const clipId = React.useId();

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
      const timer = setInterval(() => fetch(hours), AUTO_REFRESH_MS);
      return () => clearInterval(timer);
    }, [fetch, hours]);

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
    const hasData = !loading && result && taskIds.length > 0;

    const sampled = useMemo(() => {
      const m: Record<number, { time: string; value: number }[]> = {};
      for (const id of taskIds) m[id] = samplePoints(grouped[id]);
      return m;
    }, [taskIds, grouped]);

    const sampledLen = useMemo(() => taskIds.reduce((m, id) => Math.max(m, sampled[id]?.length ?? 0), 0), [taskIds, sampled]);

    const livePingMap = useMemo<Record<number, number | undefined>>(() => ({
      1: livePing10010, 2: livePing189, 3: livePing10086,
    }), [livePing10010, livePing189, livePing10086]);

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
      const result: Record<number, string> = {};
      for (const id of taskIds) {
        const pts = sampled[id];
        if (!pts || pts.length < 2) continue;
        const coords = pts.map((p, i) => ({ x: toX(i, pts.length), y: toY(p.value) }));
        let d = `M ${coords[0].x},${coords[0].y}`;
        for (let i = 1; i < coords.length; i++) {
          const p0 = coords[Math.max(i - 2, 0)], p1 = coords[i - 1], p2 = coords[i], p3 = coords[Math.min(i + 1, coords.length - 1)];
          const t = 0.18;
          d += ` C ${p1.x + (p2.x - p0.x) * t},${p1.y + (p2.y - p0.y) * t} ${p2.x - (p3.x - p1.x) * t},${p2.y - (p3.y - p1.y) * t} ${p2.x},${p2.y}`;
        }
        result[id] = d;
      }
      return result;
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

    const hoverItems = useMemo(() => {
      if (hoverIdx === null) return null;
      const results: { label: string; color: string; value: number }[] = [];
      for (const id of taskIds) {
        const pts = sampled[id];
        if (!pts || hoverIdx >= pts.length) continue;
        const cfg = TASK_CONFIG[id] || { label: `任务${id}`, color: "#888" };
        results.push({ label: cfg.label, color: cfg.color, value: pts[hoverIdx].value });
      }
      return results.length > 0 ? results : null;
    }, [hoverIdx, taskIds, sampled]);

    const allTaskIds = useMemo(() => Object.keys(grouped).map(Number).sort(), [grouped]);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {TIME_RANGES.map((r) => (
              <button key={r.hours} type="button" onClick={() => setHours(r.hours)}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs rounded-full transition-all duration-200 ${hours === r.hours ? "bg-primary text-primary-foreground font-medium shadow-sm" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}>
                {r.label}
              </button>
            ))}
            <button type="button" onClick={() => fetch(hours)} disabled={loading}
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {allTaskIds.map((id) => {
              const cfg = TASK_CONFIG[id] || { label: `任务${id}`, color: "#888" };
              const info = basicInfoMap[id];
              const liveVal = livePingMap[id];
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
                const cfg = TASK_CONFIG[id] || { label: "", color: "#888" };
                const pathD = paths[id];
                if (!pathD) return null;
                const pts = sampled[id];
                if (!pts) return null;
                const lastX = toX(pts.length - 1, pts.length);
                const lastY = toY(pts[pts.length - 1].value);
                const lastVal = pts[pts.length - 1].value;
                const endColor = isTimeout(lastVal) ? "var(--trading-down, #ff3b30)" : cfg.color;
                const labelX = lastX + 5 > PAD_L + INNER_W - 30 ? lastX - 5 : lastX + 5;
                const labelAnchor = lastX + 5 > PAD_L + INNER_W - 30 ? "end" : "start";
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
              const boxW = 85, boxH = 16 + hoverItems.length * 15;
              let bx = cx + 10;
              if (bx + boxW > PAD_L + INNER_W) bx = cx - boxW - 10;
              return (
                <g>
                  <rect x={bx} y={PAD_T + 2} width={boxW} height={boxH} rx="4" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
                  <text x={bx + 6} y={PAD_T + 13} fontSize="8" fill="var(--muted-foreground)" fontFamily="monospace">延迟</text>
                  {hoverItems.map((item, i) => (
                    <g key={i}>
                      <circle cx={bx + 10} cy={PAD_T + 20 + i * 15} r="3" fill={isTimeout(item.value) ? "var(--trading-down, #ff3b30)" : item.color} />
                      <text x={bx + 18} y={PAD_T + 23 + i * 15} fontSize="9" fill="var(--foreground)" fontFamily="monospace">{item.label} {formatValue(item.value)}</text>
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