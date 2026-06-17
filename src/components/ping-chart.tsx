"use client";

import React, { useEffect, useState, useMemo } from "react";
import { rpcAdapter } from "@/lib/rpc-adapter";
import type { PingRecordsResult, BasicInfo } from "@/lib/rpc-types";

interface PingChartProps {
  serverId: string;
}

const CHART_W = 600;
const CHART_H = 160;

const TASK_LABELS: Record<number, string> = {
  1: "联通",
  2: "电信",
  3: "移动",
};

const TASK_COLORS: Record<number, string> = {
  1: "#0ecb81",
  2: "#fcd535",
  3: "#f6465d",
};

const MAX_PING_DISPLAY = 500;

export const PingChart: React.FC<PingChartProps> = React.memo(
  function PingChart({ serverId }) {
    const [result, setResult] = useState<PingRecordsResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;
      setLoading(true);
      rpcAdapter
        .getRecords({ type: "ping", uuid: serverId, hours: 6 })
        .then((res) => {
          if (!cancelled) {
            setResult(res as PingRecordsResult);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }, [serverId]);

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
        map[b.client as unknown as number] = b;
      }
      return map;
    }, [result]);

    const taskIds = Object.keys(grouped).map(Number).sort();

    if (loading) {
      return (
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          加载延迟数据...
        </div>
      );
    }

    if (!result || taskIds.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          暂无延迟数据
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {taskIds.map((taskId) => {
          const points = grouped[taskId];
          const info = basicInfoMap[taskId];
          const label = TASK_LABELS[taskId] || `任务 ${taskId}`;
          const color = TASK_COLORS[taskId] || "#888";
          const clamped = points.map((p) => ({
            ...p,
            v: Math.min(p.value, MAX_PING_DISPLAY),
          }));
          const maxV = Math.max(...clamped.map((p) => p.v), 10);

          return (
            <div key={taskId}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                {info && (
                  <div className="text-xs text-muted-foreground font-mono flex gap-3">
                    {info.min !== undefined && <span>最小: {info.min.toFixed(0)}ms</span>}
                    {info.max !== undefined && <span>最大: {info.max.toFixed(0)}ms</span>}
                    {info.loss !== undefined && <span className={info.loss > 0 ? "text-trading-down" : ""}>丢包: {info.loss.toFixed(1)}%</span>}
                  </div>
                )}
              </div>
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                className="w-full h-24"
                role="img"
                aria-label={`${label}延迟折线图`}
              >
                <defs>
                  <linearGradient id={`grad-${taskId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {clamped.length > 1 && (
                  <>
                    <polyline
                      fill={`url(#grad-${taskId})`}
                      points={clamped
                        .map((p, i) => {
                          const x = (i / (clamped.length - 1)) * CHART_W;
                          const y = ((maxV - p.v) / maxV) * CHART_H;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />
                    <polyline
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={clamped
                        .map((p, i) => {
                          const x = (i / (clamped.length - 1)) * CHART_W;
                          const y = ((maxV - p.v) / maxV) * CHART_H;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />
                  </>
                )}
              </svg>
            </div>
          );
        })}
      </div>
    );
  }
);
PingChart.displayName = "PingChart";