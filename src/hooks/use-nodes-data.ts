/**
 * 使用 RPC 接口获取节点数据的 Hook
 * 提供更好的类型安全和错误处理
 */

import { useEffect, useState, useCallback } from "react";
import {
  getNodesInfo,
  getNodesLatestStatus,
  getNodesSnapshot,
  convertClientToServer,
} from "@/lib/api";
import type { Client, NodeStatus, Server } from "@/lib/api";
import { sortServers } from "@/lib/node-helpers";

export interface UseNodesData {
  /** 节点列表 */
  nodes: Server[];
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 上次更新时间 */
  lastUpdated: number | null;
}

export interface UseNodesOptions {
  /** 是否启用自动刷新 */
  autoRefresh?: boolean;
  /** 刷新间隔（毫秒） */
  refreshInterval?: number;
  /** 是否启用错误重试 */
  enableRetry?: boolean;
  /** 重试次数 */
  maxRetries?: number;
}

/**
 * 使用 RPC 接口获取节点数据
 */
export function useNodesData(options: UseNodesOptions = {}): UseNodesData {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30秒
    enableRetry = true,
    maxRetries = 3,
  } = options;

  const [nodes, setNodes] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchNodesData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // 优先尝试批量获取节点信息和状态，失败时回退到并行请求
      let nodesData: Client | Record<string, Client>;
      let statusData: Record<string, NodeStatus>;

      try {
        const snapshot = await getNodesSnapshot();
        nodesData = snapshot.nodes;
        statusData = snapshot.statuses;
      } catch (snapshotError) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "getNodesSnapshot failed, falling back to separate RPC calls",
            snapshotError
          );
        }
        const [fallbackNodes, fallbackStatus] = await Promise.all([
          getNodesInfo(),
          getNodesLatestStatus(),
        ]);
        nodesData = fallbackNodes;
        statusData = fallbackStatus;
      }

      const nodesMap: Record<string, Client> = {};
      const statusMap: Record<string, NodeStatus> = statusData;

      // 处理节点数据
      if (Array.isArray(nodesData)) {
        // 数组格式转换为映射
        for (const node of nodesData) {
          nodesMap[node.uuid] = node;
        }
      } else if (typeof nodesData === "object" && nodesData !== null) {
        // 对象格式直接使用
        Object.assign(nodesMap, nodesData);
      }

      // 转换为 Server 对象
      const serverList: Server[] = Object.values(nodesMap).map((client) => {
        const status = statusMap[client.uuid];
        return convertClientToServer(client, status);
      });

      // 排序规则与界面保持一致：在线优先 → 权重小优先 → alias/name 升序
      sortServers(serverList);

      setNodes(serverList);
      setLastUpdated(Date.now());
      setRetryCount(0);

      console.log(`RPC nodes loaded: ${serverList.length} nodes`);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch nodes data");
      setError(error);

      if (enableRetry && retryCount < maxRetries) {
        console.warn(
          `Failed to fetch nodes data, retrying... (${
            retryCount + 1
          }/${maxRetries})`,
          error
        );
        setRetryCount((prev) => prev + 1);

        // 指数退避重试
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          fetchNodesData();
        }, delay);
      } else {
        console.error("Failed to fetch nodes data after retries:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enableRetry, maxRetries, retryCount]);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchNodesData();
  }, [fetchNodesData]);

  // 初始加载
  useEffect(() => {
    fetchNodesData();
  }, [fetchNodesData]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchNodesData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNodesData]);

  return {
    nodes,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
}

/**
 * 使用 RPC 接口获取单个节点数据
 */
export function useNodeData(uuid: string): {
  node: Server | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [node, setNode] = useState<Server | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNodeData = useCallback(async (): Promise<void> => {
    if (!uuid) return;

    try {
      setIsLoading(true);
      setError(null);

      const [nodeData, statusData] = await Promise.all([
        getNodesInfo(uuid),
        getNodesLatestStatus(uuid),
      ]);

      const client = Array.isArray(nodeData) ? nodeData[0] : nodeData;
      const status = statusData[uuid];

      if (client) {
        const server = convertClientToServer(client, status);
        setNode(server);
      } else {
        setError(new Error("Node not found"));
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch node data");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [uuid]);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchNodeData();
  }, [fetchNodeData]);

  useEffect(() => {
    fetchNodeData();
  }, [fetchNodeData]);

  return {
    node,
    isLoading,
    error,
    refresh,
  };
}
