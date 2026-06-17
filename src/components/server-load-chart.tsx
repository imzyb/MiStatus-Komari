"use client";

import React from "react";
import { rpcAdapter } from "@/lib/rpc-adapter";
import type {
  LoadRecordsAllResult,
  LoadRecordsResult,
  StatusRecord,
} from "@/lib/rpc-types";
import { formatDateTime } from "@/lib/utils";
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  TIME_RANGE_PRESETS,
  createEmptySeriesMap,
  computeSeriesForType,
  deriveAvailableTypes,
  clampPercent,
  loadCache,
  type HoursCacheEntry,
  type LoadHistoryPoint,
  type LoadType,
} from "@/lib/server-load-chart";
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Thermometer,
  Activity,
} from "lucide-react";

interface ServerLoadChartProps {
  serverId: string;
  active: boolean;
  hours?: number;
  className?: string;
  showTypeSelector?: boolean;
  defaultLoadType?: LoadType;
  variant?: "compact" | "expanded";
  footerLabel?: string;
}

function extractStatusRecords(
  response: LoadRecordsResult | LoadRecordsAllResult,
  serverId: string
): StatusRecord[] {
  if (!response) return [];

  const { records } = response;

  if (Array.isArray(records)) {
    return records;
  }

  if (records && typeof records === "object") {
    const fromMap = records[serverId];
    return Array.isArray(fromMap) ? fromMap : [];
  }

  return [];
}

type LoadTypeConfig = {
  label: string;
  color: string;
  icon: React.ReactNode;
};

const LOAD_TYPE_CONFIG: Record<LoadType, LoadTypeConfig> = {
  cpu: {
    label: "CPU",
    color: "text-trading-up",
    icon: <Cpu className="h-3 w-3" />,
  },
  load: {
    label: "负载",
    color: "text-accent",
    icon: <Activity className="h-3 w-3" />,
  },
  ram: {
    label: "内存",
    color: "text-trading-up",
    icon: <MemoryStick className="h-3 w-3" />,
  },
  temp: {
    label: "温度",
    color: "text-trading-down",
    icon: <Thermometer className="h-3 w-3" />,
  },
  disk: {
    label: "磁盘",
    color: "text-muted-foreground",
    icon: <HardDrive className="h-3 w-3" />,
  },
};

// 使用 lib 中的顺序和数据结构

export const ServerLoadChart: React.FC<ServerLoadChartProps> = ({
  serverId,
  active,
  hours: initialHours = 6,
  className,
  showTypeSelector = true,
  defaultLoadType = "cpu",
  variant = "compact",
  footerLabel,
}) => {
  const [seriesByType, setSeriesByType] =
    React.useState<Record<LoadType, LoadHistoryPoint[]>>(createEmptySeriesMap);
  const [availableLoadTypes, setAvailableLoadTypes] = React.useState<
    LoadType[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedLoadType, setSelectedLoadType] =
    React.useState<LoadType>(defaultLoadType);
  const [selectedHours, setSelectedHours] =
    React.useState<number>(initialHours);
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  const chartRef = React.useRef<HTMLDivElement | null>(null);

  const hasRequestedRef = React.useRef(false);
  const isFetchingRef = React.useRef(false);

  const resetSeriesState = React.useCallback(() => {
    setSeriesByType(createEmptySeriesMap());
    setAvailableLoadTypes([]);
    setError(null);
    setIsLoading(false);
    hasRequestedRef.current = false;
    isFetchingRef.current = false;
  }, []);

  const fetchRecords = React.useCallback(
    async (force = false): Promise<void> => {
      if (!serverId) return;
      if (isFetchingRef.current && !force) return;

      try {
        isFetchingRef.current = true;
        setIsLoading(true);
        setError(null);

        // 命中缓存则直接使用（避免重复网络与计算）
        const serverCache = loadCache.get(serverId);
        const cacheEntry = serverCache?.get(selectedHours);

        if (cacheEntry && cacheEntry.records.length > 0 && !force) {
          const nextAvailableTypes = cacheEntry.availableTypes;
          setAvailableLoadTypes(nextAvailableTypes);

          // 确保当前选择的曲线已计算
          const cachedSeries = cacheEntry.seriesByType[selectedLoadType];
          let ensuredSeries = cachedSeries;
          if (!ensuredSeries) {
            ensuredSeries = computeSeriesForType(
              selectedLoadType,
              cacheEntry.records
            );
            cacheEntry.seriesByType[selectedLoadType] = ensuredSeries;
          }
          setSeriesByType({
            ...createEmptySeriesMap(),
            [selectedLoadType]: ensuredSeries,
          });

          setSelectedLoadType((previous) => {
            if (nextAvailableTypes.length === 0) return previous;
            if (nextAvailableTypes.includes(previous)) return previous;
            if (nextAvailableTypes.includes(defaultLoadType))
              return defaultLoadType;
            return nextAvailableTypes[0];
          });
        } else {
          const response = (await rpcAdapter.getRecords({
            type: "load",
            uuid: serverId,
            hours: selectedHours,
            load_type: "all",
            maxCount: 512,
          })) as LoadRecordsResult | LoadRecordsAllResult;

          const records = extractStatusRecords(response, serverId);
          const sortedRecords = [...records].sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );

          const nextAvailableTypes = deriveAvailableTypes(sortedRecords);

          // 初始化/写入缓存（不预计算所有曲线，只在需要时计算）
          const byHours = serverCache ?? new Map<number, HoursCacheEntry>();
          const newEntry: HoursCacheEntry = {
            records: sortedRecords,
            availableTypes: nextAvailableTypes,
            seriesByType: {},
          };
          byHours.set(selectedHours, newEntry);
          if (!serverCache) loadCache.set(serverId, byHours);

          // 计算当前选中指标曲线并设置
          const ensuredSeries = nextAvailableTypes.includes(selectedLoadType)
            ? computeSeriesForType(selectedLoadType, sortedRecords)
            : [];
          newEntry.seriesByType[selectedLoadType] = ensuredSeries;

          setAvailableLoadTypes(nextAvailableTypes);
          setSeriesByType({
            ...createEmptySeriesMap(),
            [selectedLoadType]: ensuredSeries,
          });
          setSelectedLoadType((previous) => {
            if (nextAvailableTypes.length === 0) return previous;
            if (nextAvailableTypes.includes(previous)) return previous;
            if (nextAvailableTypes.includes(defaultLoadType))
              return defaultLoadType;
            return nextAvailableTypes[0];
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch load history";
        setError(message);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [serverId, selectedHours, defaultLoadType, selectedLoadType]
  );

  React.useEffect(() => {
    resetSeriesState();
  }, [serverId, selectedHours, resetSeriesState]);

  React.useEffect(() => {
    setSelectedHours(initialHours);
  }, [initialHours]);

  React.useEffect(() => {
    setSelectedLoadType(defaultLoadType);
  }, [defaultLoadType, serverId]);

  React.useEffect(() => {
    if (!active || !serverId) return;
    if (hasRequestedRef.current) return;

    hasRequestedRef.current = true;
    void fetchRecords();
  }, [active, serverId, fetchRecords]);

  // 负载类型切换处理（按需计算并缓存）
  const handleLoadTypeChange = React.useCallback(
    (newLoadType: LoadType) => {
      setSelectedLoadType(newLoadType);

      const serverCache = loadCache.get(serverId);
      const cacheEntry = serverCache?.get(selectedHours);
      if (!cacheEntry) return;

      const cachedSeries = cacheEntry.seriesByType[newLoadType];
      if (cachedSeries) {
        setSeriesByType({
          ...createEmptySeriesMap(),
          [newLoadType]: cachedSeries,
        });
        return;
      }

      const computed = computeSeriesForType(newLoadType, cacheEntry.records);
      cacheEntry.seriesByType[newLoadType] = computed;
      // 若该类型此前未标记为可用但现在有数据，则补充
      if (computed.length && !cacheEntry.availableTypes.includes(newLoadType)) {
        cacheEntry.availableTypes = [...cacheEntry.availableTypes, newLoadType];
        setAvailableLoadTypes(cacheEntry.availableTypes);
      }
      setSeriesByType({ ...createEmptySeriesMap(), [newLoadType]: computed });
    },
    [serverId, selectedHours]
  );

  const seriesForSelectedType = React.useMemo(
    () => seriesByType[selectedLoadType] ?? [],
    [seriesByType, selectedLoadType]
  );

  const chartPoints = React.useMemo(() => {
    if (!seriesForSelectedType.length) return [];
    const step =
      seriesForSelectedType.length > 1
        ? CHART_WIDTH / (seriesForSelectedType.length - 1)
        : 0;

    return seriesForSelectedType.map((point, index) => {
      const clamped = clampPercent(point.value);
      const normalized = clamped / 100;
      const x = step * index;
      const y = CHART_HEIGHT - normalized * CHART_HEIGHT;
      return {
        x,
        y,
        value: clamped,
        time: point.time,
      };
    });
  }, [seriesForSelectedType]);

  const polylinePoints = React.useMemo(
    () =>
      chartPoints
        .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .join(" "),
    [chartPoints]
  );

  const lastPoint = React.useMemo(() => {
    if (!seriesForSelectedType.length) return null;
    return seriesForSelectedType[seriesForSelectedType.length - 1];
  }, [seriesForSelectedType]);

  const lastValueLabel = React.useMemo(() => {
    if (!lastPoint) return "";
    return `${clampPercent(lastPoint.value).toFixed(1)}%`;
  }, [lastPoint]);

  const lastUpdatedLabel = React.useMemo(() => {
    if (!lastPoint) return "";
    const timestamp = new Date(lastPoint.time).getTime();
    if (!Number.isFinite(timestamp)) {
      return "";
    }
    return formatDateTime(timestamp);
  }, [lastPoint]);

  const handleRetry = React.useCallback(() => {
    hasRequestedRef.current = true;
    void fetchRecords(true);
  }, [fetchRecords]);

  const handleHoursChange = React.useCallback(
    (hoursValue: number) => {
      if (hoursValue === selectedHours) return;
      setSelectedHours(hoursValue);
    },
    [selectedHours]
  );

  React.useEffect(() => {
    setHoverIndex(null);
  }, [selectedLoadType, selectedHours, serverId]);

  React.useEffect(() => {
    setHoverIndex((previous) => {
      if (previous == null) return previous;
      if (!chartPoints.length) return null;
      if (previous >= chartPoints.length) {
        return chartPoints.length - 1;
      }
      return previous;
    });
  }, [chartPoints.length]);

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!chartRef.current || chartPoints.length === 0) return;
      const bounds = chartRef.current.getBoundingClientRect();
      const width = bounds.width;
      if (width <= 0) return;
      const offsetX = event.clientX - bounds.left;
      const ratio = offsetX / width;
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      const targetIndex = Math.round(
        clampedRatio * Math.max(chartPoints.length - 1, 0)
      );
      const safeIndex = Math.max(
        0,
        Math.min(chartPoints.length - 1, targetIndex)
      );
      setHoverIndex((previous) =>
        previous === safeIndex ? previous : safeIndex
      );
    },
    [chartPoints.length]
  );

  const handlePointerLeave = React.useCallback(() => {
    setHoverIndex(null);
  }, []);

  const hasAvailableCategories = availableLoadTypes.length > 0;
  const selectedConfig = hasAvailableCategories
    ? LOAD_TYPE_CONFIG[selectedLoadType]
    : null;
  const selectedLabel = selectedConfig?.label ?? "历史指标";
  const hasAvailableData = seriesForSelectedType.length > 0;
  const gradientId = React.useId();

  const paddingClass =
    variant === "expanded" ? "p-4 sm:p-6" : "p-3";
  const baseContainerClass = `flex flex-col rounded-2xl bg-card shadow-sm ${paddingClass}`;
  const containerClassName = className
    ? `${baseContainerClass} ${className}`
    : `mt-3 ${baseContainerClass}`;
  const chartAreaHeightClass =
    variant === "expanded"
      ? "h-48 sm:h-56 md:h-64"
      : "h-20";

  const hoveredPoint =
    hoverIndex != null && hoverIndex >= 0 && hoverIndex < chartPoints.length
      ? chartPoints[hoverIndex]
      : null;
  const hoveredValueLabel = hoveredPoint
    ? `${hoveredPoint.value.toFixed(1)}%`
    : "";
  const hoveredTimeLabel = React.useMemo(() => {
    if (!hoveredPoint) return "";
    const timestamp = new Date(hoveredPoint.time).getTime();
    if (!Number.isFinite(timestamp)) return "";
    return formatDateTime(timestamp);
  }, [hoveredPoint]);

  return (
    <div className={containerClassName}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedConfig ? (
            <>
              <span
                className={`flex h-5 w-5 items-center justify-center ${selectedConfig.color}`}
              >
                {selectedConfig.icon}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {selectedConfig.label}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              历史指标
            </span>
          )}
        </div>
        {lastValueLabel ? (
          <span
            className="font-mono text-xs font-semibold text-foreground"
            suppressHydrationWarning
          >
            {lastValueLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {TIME_RANGE_PRESETS.map((option) => (
            <button
              key={option.hours}
              type="button"
              onClick={() => handleHoursChange(option.hours)}
className={`rounded-full px-2.5 py-0.5 transition-all duration-200 text-xs ${
                 selectedHours === option.hours
                   ? "bg-primary text-primary-foreground font-medium shadow-sm"
                   : "bg-muted/60 text-muted-foreground hover:text-foreground"
               }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={chartRef}
className={`relative mt-3 flex items-center justify-center overflow-hidden rounded-xl bg-muted/40 ${chartAreaHeightClass} ${
           hasAvailableData ? "cursor-crosshair" : ""
         }`}
        onPointerMove={hasAvailableData ? handlePointerMove : undefined}
        onPointerDown={hasAvailableData ? handlePointerMove : undefined}
        onPointerLeave={hasAvailableData ? handlePointerLeave : undefined}
      >
        {error ? (
          <button
            type="button"
            onClick={handleRetry}
            className="text-xs text-destructive underline-offset-2 hover:underline"
          >
            {selectedLabel}历史加载失败，点击重试
          </button>
        ) : hasAvailableData && polylinePoints ? (
          <>
<svg
  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
  width="100%"
  height="100%"
  preserveAspectRatio="none"
  className="text-primary"
  role="img"
  aria-label={`${selectedLabel}历史曲线图`}
>
  <defs>
    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
    </linearGradient>
  </defs>
              <path
                d={`M ${chartPoints[0]?.x.toFixed(2) ?? 0},${CHART_HEIGHT} L ${polylinePoints} L ${chartPoints[chartPoints.length - 1]?.x.toFixed(2) ?? 0},${CHART_HEIGHT} Z`}
                fill={`url(#${gradientId})`}
              />
              <path
                d={`M ${polylinePoints}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {hoveredPoint ? (
                <>
                  <line
                    x1={hoveredPoint.x.toFixed(2)}
                    x2={hoveredPoint.x.toFixed(2)}
                    y1={0}
                    y2={CHART_HEIGHT}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeOpacity="0.25"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={hoveredPoint.x.toFixed(2)}
                    cy={hoveredPoint.y.toFixed(2)}
                    r={2.5}
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </>
              ) : null}
            </svg>
            {hoveredPoint ? (
              <div
                className="pointer-events-none absolute"
                style={{
                  left: `${(hoveredPoint.x / CHART_WIDTH) * 100}%`,
                  top: `${(hoveredPoint.y / CHART_HEIGHT) * 100}%`,
                  transform: "translate(-50%, -120%)",
                }}
              >
                <div className="rounded-2xl bg-white dark:bg-[#2c2c2c] shadow-md px-2.5 py-1 text-[10px]">
                  <div className="text-[9px] text-muted-foreground">
                    {selectedLabel}
                  </div>
                  <div
                    className="font-semibold text-foreground"
                    suppressHydrationWarning
                  >
                    {hoveredValueLabel}
                  </div>
                  {hoveredTimeLabel ? (
                    <div
                      className="mt-0.5 text-[9px] text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {hoveredTimeLabel}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <span
            className="text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            {isLoading
              ? `正在加载${selectedLabel}历史...`
              : `暂无${selectedLabel}历史数据`}
          </span>
        )}
      </div>

      {showTypeSelector && availableLoadTypes.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1 text-xs text-muted-foreground">
          {availableLoadTypes.map((type) => {
            const config = LOAD_TYPE_CONFIG[type];
            const isActive = type === selectedLoadType;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleLoadTypeChange(type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted/60"
                }`}
                aria-label={`查看${config.label}历史`}
              >
                <span className={`block h-1.5 w-1.5 rounded-full ${isActive ? config.color : "bg-muted-foreground/30"}`} />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {footerLabel ? (
        <div
          className="mt-2 text-center text-xs text-muted-foreground"
          suppressHydrationWarning
        >
          {footerLabel}
        </div>
      ) : null}

      {lastUpdatedLabel ? (
        <div
          className="mt-2 text-xs text-muted-foreground"
          suppressHydrationWarning
        >
          更新于 {lastUpdatedLabel}
        </div>
      ) : null}
    </div>
  );
};
