/**
 * 使用 RPC 接口获取历史数据的 Hook
 * 支持负载记录和 Ping 记录查询
 */

import { useEffect, useState, useCallback } from "react";
import { rpcAdapter } from "@/lib/rpc-adapter";
import { retryAsync } from "@/lib/retry-merge";
import type {
  GetRecordsParams,
  StatusRecord,
  PingRecord,
} from "@/lib/rpc-types";

export interface UseRecordsOptions {
  /** 是否启用自动刷新 */
  autoRefresh?: boolean;
  /** 刷新间隔（毫秒） */
  refreshInterval?: number;
  /** 是否启用错误重试 */
  enableRetry?: boolean;
  /** 重试次数 */
  maxRetries?: number;
}

export interface UseLoadRecordsData {
  /** 负载记录 */
  records: StatusRecord[];
  /** 记录总数 */
  count: number;
  /** 时间范围 */
  timeRange: {
    from: string;
    to: string;
  };
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 上次更新时间 */
  lastUpdated: number | null;
}

export interface UsePingRecordsData {
  /** Ping 记录 */
  records: PingRecord[];
  /** 基础信息 */
  basicInfo: Array<{
    client: string;
    loss: number;
    min: number;
    max: number;
  }>;
  /** 记录总数 */
  count: number;
  /** 时间范围 */
  timeRange: {
    from: string;
    to: string;
  };
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 上次更新时间 */
  lastUpdated: number | null;
}

/**
 * 使用 RPC 接口获取负载记录
 */
export function useLoadRecords(
  params: Omit<GetRecordsParams, "type">,
  options: UseRecordsOptions = {}
): UseLoadRecordsData {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1分钟
    enableRetry = true,
    maxRetries = 3,
  } = options;

  const [records, setRecords] = useState<StatusRecord[]>([]);
  const [count, setCount] = useState(0);
  const [timeRange, setTimeRange] = useState({ from: "", to: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchRecords = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await retryAsync(
        () =>
          rpcAdapter.getRecords({
            ...params,
            type: "load",
          }),
        {
          enableRetry,
          maxRetries,
          onRetry: (attempt, error, delayMs) => {
            if (process.env.NODE_ENV !== "production") {
              console.warn(`retry(load) #${attempt} in ${delayMs}ms`, error);
            }
          },
          onGiveUp: (error) => {
            if (process.env.NODE_ENV !== "production") {
              console.error("load give up", error);
            }
          },
        }
      );

      if ("records" in result) {
        if (Array.isArray(result.records)) {
          setRecords(result.records as StatusRecord[]);
        } else {
          const allRecords: StatusRecord[] = [];
          for (const nodeRecords of Object.values(result.records)) {
            allRecords.push(...nodeRecords);
          }
          setRecords(allRecords);
        }
        setCount(result.count);
        setTimeRange({ from: result.from, to: result.to });
      }

      setLastUpdated(Date.now());
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch load records");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [params, enableRetry, maxRetries]);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchRecords();
  }, [fetchRecords]);

  // 参数变化时重新获取数据
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRecords();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchRecords]);

  return {
    records,
    count,
    timeRange,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
}

/**
 * 使用 RPC 接口获取 Ping 记录
 */
export function usePingRecords(
  params: Omit<GetRecordsParams, "type">,
  options: UseRecordsOptions = {}
): UsePingRecordsData {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1分钟
    enableRetry = true,
    maxRetries = 3,
  } = options;

  const [records, setRecords] = useState<PingRecord[]>([]);
  const [basicInfo, setBasicInfo] = useState<
    Array<{
      client: string;
      loss: number;
      min: number;
      max: number;
    }>
  >([]);
  const [count, setCount] = useState(0);
  const [timeRange, setTimeRange] = useState({ from: "", to: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchRecords = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await retryAsync(
        () =>
          rpcAdapter.getRecords({
            ...params,
            type: "ping",
          }),
        {
          enableRetry,
          maxRetries,
          onRetry: (attempt, error, delayMs) => {
            if (process.env.NODE_ENV !== "production") {
              console.warn(`retry(ping) #${attempt} in ${delayMs}ms`, error);
            }
          },
          onGiveUp: (error) => {
            if (process.env.NODE_ENV !== "production") {
              console.error("ping give up", error);
            }
          },
        }
      );

      if ("records" in result && "basic_info" in result) {
        setRecords(result.records);
        setBasicInfo(result.basic_info);
        setCount(result.count);
        setTimeRange({
          from: result.from,
          to: result.to,
        });
      }

      setLastUpdated(Date.now());
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch ping records");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [params, enableRetry, maxRetries]);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchRecords();
  }, [fetchRecords]);

  // 参数变化时重新获取数据
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRecords();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchRecords]);

  return {
    records,
    basicInfo,
    count,
    timeRange,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
}

/**
 * 使用 RPC 接口获取节点最近状态记录
 */
export function useNodeRecentStatus(
  uuid: string,
  options: UseRecordsOptions = {}
): {
  records: StatusRecord[];
  count: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30秒
    enableRetry = true,
    maxRetries = 3,
  } = options;

  const [records, setRecords] = useState<StatusRecord[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecords = useCallback(async (): Promise<void> => {
    if (!uuid) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await retryAsync(
        () => rpcAdapter.getNodeRecentStatus({ uuid }),
        {
          enableRetry,
          maxRetries,
          onRetry: (attempt, error, delayMs) => {
            if (process.env.NODE_ENV !== "production") {
              console.warn(`retry(recent) #${attempt} in ${delayMs}ms`, error);
            }
          },
          onGiveUp: (error) => {
            if (process.env.NODE_ENV !== "production") {
              console.error("recent give up", error);
            }
          },
        }
      );
      setRecords(result.records);
      setCount(result.count);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch recent status");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [uuid, enableRetry, maxRetries]);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRecords();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchRecords]);

  return {
    records,
    count,
    isLoading,
    error,
    refresh,
  };
}
