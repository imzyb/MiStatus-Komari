"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Activity, RefreshCw, ZoomOut, LayoutGrid, LayoutList } from "lucide-react";
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
const MAX_POINTS = 300;
const PAD_L = 40, PAD_R = 8, PAD_T = 20, PAD_B = 36;
const INNER_W = 560, INNER_H = 204;
const CHART_W = PAD_L + INNER_W + PAD_R;
const CHART_H = PAD_T + INNER_H + PAD_B;
const SLIDER_H = 16;
const SLIDER_Y = PAD_T + INNER_H + 4;

function niceMax(v: number): number {
  if (v <= 50) return 100;
  if (v <= 100) return 150;
  if (v <= 200) return 300;
  if (v <= 500) return Math.ceil(v / 100) * 100;
  if (v <= 1000) return Math.ceil(v / 200) * 200;
  return Math.ceil(v / 500) * 500;
}

function generateTicks(max: number): number[] {
  const ticks = [0];
  const step = max <= 150 ? 25 : max <= 300 ? 50 : max <= 500 ? 100 : max <= 1000 ? 200 : 500;
  for (let v = step; v < max; v += step) ticks.push(v);
  ticks.push(max);
  return ticks;
}

const TIME_RANGES = [
  { hours: 6, label: "6H" }, { hours: 12, label: "12H" },
  { hours: 24, label: "24H" }, { hours: 48, label: "48H" },
  { hours: 168, label: "7D" },
] as const;

function isTimeout(v: number): boolean { return v === TIMEOUT_VALUE || v < 0; }

function formatValue(v: number): string {
  if (isTimeout(v)) return "超时";
  return `${v}ms`;
}

function latencyQuality(ms: number): string {
  if (ms < 50) return "text-trading-up";
  if (ms < 150) return "text-accent";
  return "text-trading-down";
}

function latencyQualityColor(ms: number): string {
  if (isTimeout(ms)) return "var(--trading-down, #ff3b30)";
  if (ms < 50) return "var(--trading-up, #34c759)";
  if (ms < 150) return "var(--accent, #ff6a00)";
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

function computeAvg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function computePeakShavingThreshold(values: number[]): { median: number; tolerancePercent: number } {
  const filtered = values.filter((v) => v > 0);
  if (filtered.length < 3) return { median: 0, tolerancePercent: 0.5 };
  const sorted = [...filtered].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * 0.1);
  const trimmed = trimCount >= 1 ? sorted.slice(trimCount, sorted.length - trimCount) : sorted;
  const mid = Math.floor(trimmed.length / 2);
  const median = trimmed.length % 2 !== 0 ? trimmed[mid] : (trimmed[mid - 1] + trimmed[mid]) / 2;
  let tolerancePercent = 0.5;
  if (median > 100) tolerancePercent = 0.15;
  else if (median > 50) tolerancePercent = 0.20;
  else if (median > 30) tolerancePercent = 0.25;
  else if (median > 10) tolerancePercent = 0.35;
  return { median, tolerancePercent };
}

function TooltipContent({ hoverIdx, taskIds, sampled, taskConfig: tcfg, padL, padT, innerW, sampledLen, sampledPoints }
: {
  hoverIdx: number;
  taskIds: number[];
  sampled: Record<number, { time: string; value: number }[]>;
  taskConfig: Record<number, TaskConfigItem>;
  padL: number;
  padT: number;
  innerW: number;
  sampledLen: number;
  sampledPoints: { time: string; value: number }[] | undefined;
}) {
  const items = taskIds.map((id) => {
    const pts = sampled[id];
    const cfg = tcfg[id] || { label: `任务${id}`, color: "#888" };
    return pts && hoverIdx < pts.length
      ? { label: cfg.label, color: cfg.color, value: pts[hoverIdx].value }
      : null;
  }).filter(Boolean) as { label: string; color: string; value: number }[];

  if (items.length === 0) return null;

  const timeStr = sampledPoints && hoverIdx < sampledPoints.length
    ? (() => { const d = new Date(sampledPoints[hoverIdx].time); return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`; })()
    : "";

  const x = padL + (hoverIdx / Math.max(sampledLen - 1, 1)) * innerW;
  const boxW = 100 + (items.length > 2 ? 20 : 0), boxH = 24 + items.length * 16;
  let bx = x + 10;
  if (bx + boxW > padL + innerW) bx = x - boxW - 10;

  return (
    <g>
      <defs>
        <filter id="tooltip-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="rgba(0,0,0,0.15)" />
        </filter>
      </defs>
      <rect x={bx} y={padT + 2} width={boxW} height={boxH} rx="8" fill="var(--background)" fillOpacity="0.94" stroke="var(--border)" strokeWidth="1" filter="url(#tooltip-shadow)" />
      {timeStr && <text x={bx + 8} y={padT + 14} fontSize="8" fill="var(--primary)" fontFamily="monospace" fontWeight="600">{timeStr}</text>}
      {items.map((item, i) => (
        <g key={i}>
          <circle cx={bx + 8} cy={padT + 24 + i * 16} r="3" fill={isTimeout(item.value) ? "var(--trading-down, #ff3b30)" : item.color} />
          <text x={bx + 16} y={padT + 27 + i * 16} fontSize="9" fill="var(--foreground)" fontFamily="monospace">
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
    const [peakShaving, setPeakShaving] = useState(false);
    const [chartMode, setChartMode] = useState<"multi" | "single">("multi");
    const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
    const svgRef = useRef<SVGSVGElement>(null);
    const clipId = React.useId();
    const areaClipId = React.useId();

    const [rangeStart, setRangeStart] = useState(0);
    const [rangeEnd, setRangeEnd] = useState(1);
    const isDragging = useRef(false);
    const dragType = useRef<"handleLeft" | "handleRight" | "pan">("pan");
    const dragStartX = useRef(0);
    const dragStartRange = useRef({ s: 0, e: 1 });

    const fetch = useCallback(async (h: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await rpcAdapter.getRecords({ type: "ping", uuid: serverId, hours: h });
        setResult(res as PingRecordsResult);
        setRangeStart(0);
        setRangeEnd(1);
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

    const taskIds = useMemo(() => ISP_ORDER.filter((id) => (grouped[id]?.length ?? 0) > 0 && !hiddenIds.has(id)), [grouped, hiddenIds]);
    const allTaskIds = useMemo(() => ISP_ORDER.filter((id) => (grouped[id]?.length ?? 0) > 0), [grouped]);
    const hasData = !loading && !error && result && taskIds.length > 0;

    const sampled = useMemo(() => {
      const m: Record<number, { time: string; value: number }[]> = {};
      for (const id of ISP_ORDER) {
        if (!grouped[id]) continue;
        let pts = grouped[id];
        if (peakShaving) {
          const valid = pts.filter((p) => !isTimeout(p.value)).map((p) => p.value);
          if (valid.length >= 3) {
            const { median, tolerancePercent } = computePeakShavingThreshold(valid);
            const tolerance = median * tolerancePercent;
            pts = pts.filter((p) => isTimeout(p.value) || Math.abs(p.value - median) <= tolerance);
          }
        }
        m[id] = samplePointsMax(pts);
      }
      return m;
    }, [grouped, peakShaving]);

    const sampledLen = useMemo(() => taskIds.reduce((m, id) => Math.max(m, sampled[id]?.length ?? 0), 0), [taskIds, sampled]);

    const visibleRange = useMemo(() => {
      if (rangeStart <= 0 && rangeEnd >= 1) return { startIdx: 0, endIdx: sampledLen };
      const startIdx = Math.floor(rangeStart * sampledLen);
      const endIdx = Math.ceil(rangeEnd * sampledLen);
      return { startIdx: Math.max(0, startIdx), endIdx: Math.min(sampledLen, endIdx) };
    }, [rangeStart, rangeEnd, sampledLen]);

    const visibleTaskIds = useMemo(
      () => taskIds.filter((id) => sampled[id] && sampled[id]!.length > 0),
      [taskIds, sampled],
    );

    const livePingResolved = useMemo<Record<number, number | undefined>>(() => livePingMap ?? {}, [livePingMap]);

    const yMax = useMemo(() => {
      let maxVal = 0;
      for (const id of taskIds) {
        const pts = sampled[id];
        if (!pts) continue;
        for (const p of pts) {
          if (!isTimeout(p.value) && p.value > maxVal) maxVal = p.value;
        }
      }
      return Math.max(niceMax(maxVal), 100);
    }, [taskIds, sampled]);

    const yTicks = useMemo(() => generateTicks(yMax), [yMax]);

    const toXGlobal = (i: number, n: number) => PAD_L + (i / Math.max(n - 1, 1)) * INNER_W;
    const toY = (v: number): number => {
      if (isTimeout(v)) return PAD_T;
      return PAD_T + INNER_H - (Math.min(Math.max(v, 0), yMax) / yMax) * INNER_H;
    };

    const paths = useMemo(() => {
      const pathResult: Record<number, string> = {};
      const areaResult: Record<number, string> = {};
      const yMin = PAD_T;
      const yMaxPx = PAD_T + INNER_H;
      const limitY = (y: number) => Math.min(yMaxPx, Math.max(yMin, y));

      for (const id of visibleTaskIds) {
        const pts = sampled[id];
        if (!pts || pts.length < 2) continue;
        const { startIdx, endIdx } = visibleRange;
        const visiblePts = pts.slice(startIdx, endIdx);
        if (visiblePts.length < 2) continue;
        const coords = visiblePts.map((p, i) => ({ x: toXGlobal(i, visiblePts.length), y: isTimeout(p.value) ? PAD_T : PAD_T + INNER_H - (Math.min(Math.max(p.value, 0), yMax) / yMax) * INNER_H }));
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
        const bottomY = PAD_T + INNER_H;
        areaResult[id] = `${d} L ${coords[coords.length - 1].x},${bottomY} L ${coords[0].x},${bottomY} Z`;
      }
      return { lines: pathResult, areas: areaResult };
    }, [visibleTaskIds, sampled, visibleRange, yMax]);

    const overviewPaths = useMemo(() => {
      const result: Record<number, string> = {};
      for (const id of visibleTaskIds) {
        const pts = sampled[id];
        if (!pts || pts.length < 2) continue;
        const ovW = INNER_W;
        const ovH = SLIDER_H;
        const ovY = SLIDER_Y;
        const coords = pts.map((p, i) => {
          const x = PAD_L + (i / Math.max(pts.length - 1, 1)) * ovW;
          const y = ovY + ovH - (Math.min(Math.max(p.value, 0), yMax) / yMax) * ovH;
          return { x, y };
        });
        let d = `M ${coords[0].x},${coords[0].y}`;
        for (let i = 1; i < coords.length; i++) {
          d += ` L ${coords[i].x},${coords[i].y}`;
        }
        result[id] = d;
      }
      return result;
    }, [visibleTaskIds, sampled, yMax]);

    const timeLabels = useMemo(() => {
      if (visibleTaskIds.length === 0) return [];
      const pts = sampled[visibleTaskIds[0]];
      if (!pts) return [];
      const { startIdx, endIdx } = visibleRange;
      const visiblePts = pts.slice(startIdx, endIdx);
      if (visiblePts.length === 0) return [];
      const labels: { x: number; label: string }[] = [];
      const showDate = hours >= 24;
      const maxLabels = hours >= 168 ? 5 : hours >= 48 ? 6 : hours >= 24 ? 7 : 8;
      const step = Math.max(Math.floor(visiblePts.length / maxLabels), 1);
      for (let idx = 0; idx < visiblePts.length; idx += step) {
        const d = new Date(visiblePts[idx].time);
        const hm = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
        labels.push({ x: toXGlobal(idx, visiblePts.length), label: showDate ? `${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")} ${hm}` : hm });
      }
      if (visiblePts.length > 1 && (visiblePts.length - 1) % step !== 0) {
        const d = new Date(visiblePts[visiblePts.length - 1].time);
        const hm = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
        labels.push({ x: toXGlobal(visiblePts.length - 1, visiblePts.length), label: showDate ? `${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")} ${hm}` : hm });
      }
      return labels;
    }, [visibleTaskIds, sampled, visibleRange, hours]);

    const hoverAt = useCallback((clientX: number) => {
      const svg = svgRef.current;
      if (!svg || sampledLen === 0) return;
      const rect = svg.getBoundingClientRect();
      const xInPlot = ((clientX - rect.left) / rect.width) * CHART_W - PAD_L;
      if (xInPlot < 0 || xInPlot > INNER_W) { setHoverIdx(null); return; }
      const { startIdx, endIdx } = visibleRange;
      const visibleCount = endIdx - startIdx;
      if (visibleCount <= 0) { setHoverIdx(null); return; }
      const localIdx = Math.round((xInPlot / INNER_W) * (visibleCount - 1));
      setHoverIdx(Math.min(startIdx + localIdx, sampledLen - 1));
    }, [sampledLen, visibleRange]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => hoverAt(e.clientX), [hoverAt]);
    const handleTouchMove = useCallback((e: React.TouchEvent) => { if (e.touches.length > 0) { e.preventDefault(); hoverAt(e.touches[0].clientX); } }, [hoverAt]);
    const handleMouseLeave = useCallback(() => setHoverIdx(null), []);

    const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const xInPlot = ((e.clientX - rect.left) / rect.width) * CHART_W - PAD_L;
      const ratio = Math.max(0, Math.min(1, xInPlot / INNER_W));
      const distL = Math.abs(ratio - rangeStart);
      const distR = Math.abs(ratio - rangeEnd);
      if (distL < distR && distL < 0.05) {
        dragType.current = "handleLeft";
      } else if (distR < 0.05) {
        dragType.current = "handleRight";
      } else {
        dragType.current = "pan";
      }
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartRange.current = { s: rangeStart, e: rangeEnd };
    }, [rangeStart, rangeEnd]);

    const handleGlobalMouseMove = useCallback((ev: MouseEvent) => {
      if (!isDragging.current || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - dragStartX.current) / rect.width) * CHART_W;
      const dr = dx / INNER_W;
      const { s, e } = dragStartRange.current;
      const span = e - s;
      if (dragType.current === "handleLeft") {
        setRangeStart(Math.max(0, Math.min(s + dr, rangeEnd - 0.02)));
      } else if (dragType.current === "handleRight") {
        setRangeEnd(Math.min(1, Math.max(e + dr, rangeStart + 0.02)));
      } else {
        let ns = s + dr;
        let ne = e + dr;
        if (ns < 0) { ns = 0; ne = span; }
        if (ne > 1) { ne = 1; ns = 1 - span; }
        setRangeStart(ns);
        setRangeEnd(ne);
      }
    }, [rangeStart, rangeEnd]);

    const handleGlobalMouseUp = useCallback(() => {
      isDragging.current = false;
    }, []);

    useEffect(() => {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }, [handleGlobalMouseMove, handleGlobalMouseUp]);;

    const toggleIdVisibility = useCallback((id: number) => {
      setHiddenIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }, []);

    const allValidPoints: Record<number, number[]> = useMemo(() => {
      const m: Record<number, number[]> = {};
      for (const id of allTaskIds) {
        const pts = grouped[id];
        if (!pts) continue;
        m[id] = pts.filter((p) => !isTimeout(p.value)).map((p) => p.value);
      }
      return m;
    }, [allTaskIds, grouped]);

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

    const sliderSelW = (rangeEnd - rangeStart) * INNER_W;
    const sliderSelX = PAD_L + rangeStart * INNER_W;
    const allH = CHART_H;

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
          <div className="flex items-center gap-2">
            <button type="button"
              onClick={() => setChartMode((m) => m === "multi" ? "single" : "multi")}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={chartMode === "multi" ? "切换为单图模式" : "切换为聚合模式"}
              title={chartMode === "multi" ? "单图模式" : "聚合模式"}>
              {chartMode === "multi" ? <LayoutList className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
            </button>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span className="text-[11px] text-muted-foreground">削峰</span>
              <div
                onClick={() => setPeakShaving((p) => !p)}
                className={`relative w-7 h-4 rounded-full transition-colors duration-200 ${peakShaving ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${peakShaving ? "translate-x-3" : ""}`} />
              </div>
            </label>
            {rangeEnd - rangeStart < 1 && (
              <button type="button" onClick={() => { setRangeStart(0); setRangeEnd(1); }}
                aria-label="重置缩放"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <ZoomOut className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {allTaskIds.map((id) => {
            const cfg = tcfg[id] || { label: `任务${id}`, color: "#888" };
            const info = basicInfoMap[id];
            const liveVal = livePingResolved[id];
            const pts = grouped[id];
            const lastVal = liveVal !== undefined ? liveVal : (pts && pts.length > 0 ? pts[pts.length - 1].value : undefined);
            const validVals = allValidPoints[id] || [];
            const avgMs = validVals.length > 0 ? computeAvg(validVals) : 0;
            const totalPts = pts ? pts.length : 0;
            const timeoutCount = pts ? pts.filter((p) => isTimeout(p.value)).length : 0;
            const timeoutRate = totalPts > 0 ? (timeoutCount / totalPts * 100) : 0;
            const isHidden = hiddenIds.has(id);
            return (
              <div key={id}
                onClick={() => toggleIdVisibility(id)}
                className={`flex items-center gap-1 text-[11px] cursor-pointer select-none transition-opacity ${isHidden ? "opacity-40" : "hover:opacity-80"}`}>
                <PingDot color={cfg.color} value={isHidden ? undefined : lastVal} />
                <span className="font-medium text-foreground/70">{cfg.label}</span>
                {lastVal !== undefined && !isHidden && (
                  <span className={`font-mono font-medium ${isTimeout(lastVal) ? "text-trading-down" : latencyQuality(lastVal)}`}>{formatValue(lastVal)}</span>
                )}
                {info && <span className="text-muted-foreground font-mono text-[10px]">{info.min.toFixed(0)}~{info.max.toFixed(0)}ms</span>}
                {avgMs > 0 && <span className="text-muted-foreground font-mono text-[10px]">均{avgMs.toFixed(0)}ms</span>}
                {info && info.loss > 0 && <span className="font-mono text-[10px] text-trading-down">丢包{info.loss.toFixed(1)}%</span>}
                {timeoutRate > 0 && timeoutRate > (info?.loss || 0) && (
                  <span className="font-mono text-[10px] text-trading-down">超时{timeoutRate.toFixed(1)}%</span>
                )}
                {liveVal !== undefined && !isHidden && <span className="h-1 w-1 rounded-full bg-trading-up animate-pulse ml-0.5" title="实时" />}
              </div>
            );
          })}
        </div>

        {chartMode === "multi" ? (
          <svg ref={svgRef} viewBox={`0 0 ${CHART_W} ${allH}`} width="100%" className="w-full touch-none" role="img" aria-label="延迟监测曲线图"
            style={{ height: `calc(56px + ${allH / CHART_W * 100}vw)`, maxHeight: `calc(72px + ${allH / CHART_W * 100}vw)` }}
            onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onTouchMove={handleTouchMove} onTouchEnd={handleMouseLeave}>
            <defs>
              <clipPath id={clipId}><rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} /></clipPath>
              <clipPath id={areaClipId}><rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} /></clipPath>
              {visibleTaskIds.map((id) => {
                const cfg = tcfg[id] || { color: "#888" };
                const fillColor = cfg.color;
                return (
                  <linearGradient key={id} id={`${areaClipId}-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fillColor} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
                  </linearGradient>
                );
              })}
            </defs>
            <rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} fill="currentColor" fillOpacity="0.015" rx="2" />
            <rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" rx="2" />
            {yTicks.map((v) => {
              const y = toY(v);
              return (
                <g key={v}>
                  <line x1={PAD_L} x2={PAD_L + INNER_W} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="4 3" />
                  <text x={PAD_L - 6} y={y + 3} textAnchor="end" fill="currentColor" opacity="0.4" fontSize="9" fontFamily="monospace">{v}</text>
                </g>
              );
            })}
            {timeLabels.map((t, i) => (
              <text key={i} x={t.x} y={PAD_T + INNER_H + 14} textAnchor="middle" fill="currentColor" opacity="0.4" fontSize="8" fontFamily="monospace">{t.label}</text>
            ))}
            <g clipPath={`url(#areaClipId)`}>
              {visibleTaskIds.map((id) => {
                const areaD = paths.areas[id];
                if (!areaD) return null;
                return <path key={id} d={areaD} fill={`url(#${areaClipId}-${id})`} />;
              })}
              {visibleTaskIds.map((id) => {
                const cfg = tcfg[id] || { label: "", color: "#888" };
                const pathD = paths.lines[id];
                if (!pathD) return null;
                const pts = sampled[id];
                if (!pts) return null;
                const { endIdx } = visibleRange;
                const visiblePts = pts.slice(visibleRange.startIdx, endIdx);
                if (visiblePts.length < 2) return null;
                const lastX = toXGlobal(visiblePts.length - 1, visiblePts.length);
                const lastY = toY(visiblePts[visiblePts.length - 1].value);
                const lastVal = visiblePts[visiblePts.length - 1].value;
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
                <line x1={toXGlobal(hoverIdx - visibleRange.startIdx, visibleRange.endIdx - visibleRange.startIdx)} x2={toXGlobal(hoverIdx - visibleRange.startIdx, visibleRange.endIdx - visibleRange.startIdx)} y1={PAD_T} y2={PAD_T + INNER_H} stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3 3" />
                {taskIds.map((id) => {
                  const pts = sampled[id];
                  if (!pts || hoverIdx >= pts.length) return null;
                  const val = pts[hoverIdx].value;
                  const cfg = tcfg[id] || { color: "#888" };
                  const localIdx = Math.max(0, Math.min(hoverIdx - visibleRange.startIdx, visibleRange.endIdx - visibleRange.startIdx - 1));
                  const x = toXGlobal(localIdx, visibleRange.endIdx - visibleRange.startIdx);
                  return (
                    <circle key={id} cx={x} cy={toY(val)} r="3.5"
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
                  sampledPoints={visibleTaskIds.length > 0 ? sampled[visibleTaskIds[0]] : undefined}
                />
              </>
            )}
            <rect x={PAD_L} y={SLIDER_Y} width={INNER_W} height={SLIDER_H} rx="4" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
            <g clipPath={`url(#clipId)`}>
              {visibleTaskIds.map((id) => {
                const d = overviewPaths[id];
                if (!d) return null;
                const cfg = tcfg[id] || { color: "#888" };
                return <path key={id} d={d} fill="none" stroke={cfg.color} strokeOpacity="0.5" strokeWidth="1" />;
              })}
            </g>
            <rect x={sliderSelX} y={SLIDER_Y - 1} width={sliderSelW} height={SLIDER_H + 2} rx="5" fill="var(--primary)" fillOpacity="0.2" stroke="var(--primary)" strokeOpacity="0.5" strokeWidth="1"
              style={{ cursor: "pointer" }}
              onMouseDown={handleSliderMouseDown} />
            {rangeEnd - rangeStart < 1 && (
              <>
                <rect x={sliderSelX - 3} y={SLIDER_Y - 2} width="6" height={SLIDER_H + 4} rx="3" fill="var(--primary)" opacity="0.8"
                  style={{ cursor: "ew-resize" }}
                  onMouseDown={(e) => { e.stopPropagation(); dragType.current = "handleLeft"; isDragging.current = true; dragStartX.current = e.clientX; dragStartRange.current = { s: rangeStart, e: rangeEnd }; }} />
                <rect x={sliderSelX + sliderSelW - 3} y={SLIDER_Y - 2} width="6" height={SLIDER_H + 4} rx="3" fill="var(--primary)" opacity="0.8"
                  style={{ cursor: "ew-resize" }}
                  onMouseDown={(e) => { e.stopPropagation(); dragType.current = "handleRight"; isDragging.current = true; dragStartX.current = e.clientX; dragStartRange.current = { s: rangeStart, e: rangeEnd }; }} />
              </>
            )}
          </svg>
        ) : (
          <div className="space-y-4">
            {visibleTaskIds.map((id) => {
              const cfg = tcfg[id] || { label: "", color: "#888" };
              const pts = sampled[id];
              if (!pts || pts.length < 2) return null;
              const { endIdx } = visibleRange;
              const visiblePts = pts.slice(visibleRange.startIdx, endIdx);
              if (visiblePts.length < 2) return null;
              const lastVal = visiblePts[visiblePts.length - 1].value;
              const validVals = allValidPoints[id] || [];
              const avgMs = validVals.length > 0 ? computeAvg(validVals) : 0;
              return (
                <div key={id} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="font-medium text-foreground/70">{cfg.label}</span>
                    {!isTimeout(lastVal) && (
                      <span className={`font-mono font-medium ${latencyQuality(lastVal)}`}>{formatValue(lastVal)}</span>
                    )}
                    {avgMs > 0 && <span className="text-muted-foreground font-mono">均{avgMs.toFixed(0)}ms</span>}
                  </div>
                  <svg viewBox={`0 0 ${CHART_W} ${PAD_T + INNER_H + PAD_B}`} width="100%" className="w-full touch-none h-40 sm:h-48"
                    onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onTouchMove={handleTouchMove} onTouchEnd={handleMouseLeave}>
                    <defs>
                      <clipPath id={`${clipId}-${id}`}><rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} /></clipPath>
                      <linearGradient id={`${areaClipId}-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={cfg.color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={cfg.color} stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} fill="currentColor" fillOpacity="0.015" rx="2" />
                    <rect x={PAD_L} y={PAD_T} width={INNER_W} height={INNER_H} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" rx="2" />
                    {yTicks.map((v) => {
                      const y = toY(v);
                      return (
                        <g key={v}>
                          <line x1={PAD_L} x2={PAD_L + INNER_W} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="4 3" />
                          <text x={PAD_L - 6} y={y + 3} textAnchor="end" fill="currentColor" opacity="0.4" fontSize="9" fontFamily="monospace">{v}</text>
                        </g>
                      );
                    })}
                    {timeLabels.map((t, i) => (
                      <text key={i} x={t.x} y={PAD_T + INNER_H + 14} textAnchor="middle" fill="currentColor" opacity="0.4" fontSize="8" fontFamily="monospace">{t.label}</text>
                    ))}
                    <g clipPath={`url(#${clipId}-${id})`}>
                      {paths.areas[id] && <path d={paths.areas[id]} fill={`url(#${areaClipId}-${id})`} />}
                      {paths.lines[id] && <path d={paths.lines[id]} fill="none" stroke={cfg.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
                      {(() => {
                        const lx = toXGlobal(visiblePts.length - 1, visiblePts.length);
                        const ly = toY(lastVal);
                        const sc = latencyQualityColor(lastVal);
                        const lvx = lx + 5 > PAD_L + INNER_W - 30 ? lx - 5 : lx + 5;
                        const lva = lx + 5 > PAD_L + INNER_W - 30 ? "end" : "start";
                        return (
                          <g>
                            <circle cx={lx} cy={ly} r="3.5" fill={sc} stroke="var(--background)" strokeWidth="1" />
                            <text x={lvx} y={ly + 3} textAnchor={lva} fill={sc} fontSize="9" fontFamily="monospace" fontWeight="600">
                              {formatValue(lastVal)}
                            </text>
                          </g>
                        );
                      })()}
                      {hoverIdx !== null && pts[hoverIdx] && (
                        <circle cx={toXGlobal(Math.max(0, Math.min(hoverIdx - visibleRange.startIdx, visibleRange.endIdx - visibleRange.startIdx - 1)), visibleRange.endIdx - visibleRange.startIdx)} cy={toY(pts[hoverIdx].value)} r="3.5"
                          fill={isTimeout(pts[hoverIdx].value) ? "var(--trading-down, #ff3b30)" : cfg.color} stroke="var(--background)" strokeWidth="2" />
                      )}
                    </g>
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
PingChart.displayName = "PingChart";