import type { StatusRecord } from "@/lib/rpc-types";

export type LoadType = "cpu" | "load" | "ram" | "temp" | "disk";

export type LoadHistoryPoint = {
  time: string;
  value: number;
};

export const CHART_WIDTH = 280;
export const CHART_HEIGHT = 72;

export const TIME_RANGE_PRESETS = [
  { hours: 1, label: "1H" },
  { hours: 6, label: "6H" },
  { hours: 12, label: "12H" },
  { hours: 24, label: "1D" },
  { hours: 72, label: "3D" },
] as const;

export const LOAD_TYPE_ORDER: LoadType[] = [
  "cpu",
  "ram",
  "disk",
  "load",
  "temp",
];

export const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

export const ratioToPercent = (used: number, total: number): number | null => {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  return (used / total) * 100;
};

export function computePercentForType(
  type: LoadType,
  record: StatusRecord
): number | null {
  switch (type) {
    case "cpu":
      return Number.isFinite(record.cpu) ? clampPercent(record.cpu) : null;
    case "load":
      return Number.isFinite(record.load)
        ? clampPercent(record.load * 100)
        : null;
    case "ram": {
      const percent = ratioToPercent(record.ram, record.ram_total);
      return percent == null ? null : clampPercent(percent);
    }
    case "temp": {
      if (!Number.isFinite(record.temp) || record.temp <= 0) return null;
      return clampPercent(record.temp);
    }
    case "disk": {
      const percent = ratioToPercent(record.disk, record.disk_total);
      return percent == null ? null : clampPercent(percent);
    }
    default:
      return null;
  }
}

export const createEmptySeriesMap = (): Record<
  LoadType,
  LoadHistoryPoint[]
> => {
  return LOAD_TYPE_ORDER.reduce((acc, type) => {
    acc[type] = [];
    return acc;
  }, {} as Record<LoadType, LoadHistoryPoint[]>);
};

export function computeSeriesForType(
  type: LoadType,
  records: StatusRecord[]
): LoadHistoryPoint[] {
  const points: LoadHistoryPoint[] = [];
  for (const record of records) {
    const percent = computePercentForType(type, record);
    if (percent == null) continue;
    points.push({ time: record.time, value: clampPercent(percent) });
  }
  return points;
}

export function deriveAvailableTypes(records: StatusRecord[]): LoadType[] {
  const available: LoadType[] = [];
  for (const type of LOAD_TYPE_ORDER) {
    let found = false;
    for (const record of records) {
      const percent = computePercentForType(type, record);
      if (percent != null) {
        found = true;
        break;
      }
    }
    if (found) available.push(type);
  }
  return available;
}

export type SeriesCache = Partial<Record<LoadType, LoadHistoryPoint[]>>;
export type HoursCacheEntry = {
  records: StatusRecord[];
  availableTypes: LoadType[];
  seriesByType: SeriesCache;
};

export const loadCache: Map<string, Map<number, HoursCacheEntry>> = new Map();
