"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import type { StatsResponse, Server } from "@/lib/api";
import {
  getNodesInfo,
  getNodesSnapshot,
  convertClientToServer,
} from "@/lib/api";
import { config } from "@/lib/config";
import type { NodeBase } from "@/lib/node-helpers";
import { createNodesMap, createNodesMapFromRest } from "@/lib/node-helpers";
import { createWebSocketHandler } from "@/lib/websocket-helpers";
import { createServerFromRealtimeData, sortServers } from "@/lib/node-helpers";
import type { WsNodeRealtime } from "@/lib/node-helpers";
import type { Client } from "@/lib/rpc-types";

export interface ServersContextValue {
  /** 服务器数据 */
  data: StatsResponse | undefined;
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 手动刷新数据 */
  refresh: () => void;
  /** 是否使用 RPC */
  useRpc: boolean;
  /** 切换 RPC 模式 */
  toggleRpc: () => void;
  /** 连接状态 */
  isConnected: boolean;
  /** 重连次数 */
  reconnectCount: number;
}

export interface ServersStatusValue {
  /** 连接状态 */
  isConnected: boolean;
  /** 重连次数 */
  reconnectCount: number;
}

const ServersContext = createContext<ServersContextValue | null>(null);
const ServersStatusContext = createContext<ServersStatusValue | null>(null);

export interface ServersProviderProps {
  children: React.ReactNode;
  /** 是否启用 RPC，默认 true */
  enableRpc?: boolean;
  /** 是否启用 WebSocket，默认 true */
  enableWebSocket?: boolean;
  /** 刷新间隔（毫秒），默认使用配置值 */
  refreshInterval?: number;
}

/**
 * 服务器数据 Provider
 * 统一管理服务器数据的获取、缓存和 WebSocket 连接，确保全局只有一个数据源
 */
export function ServersProvider({
  children,
  enableRpc = true,
  enableWebSocket = true,
  refreshInterval = config.refreshInterval,
}: ServersProviderProps) {
  const [data, setData] = useState<StatsResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [useRpc, setUseRpc] = useState<boolean>(enableRpc);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectCount, setReconnectCount] = useState<number>(0);

  // 节点基础信息（来自 RPC 或 REST）
  const nodesMapRef = useRef<Record<string, NodeBase>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const wsCleanupRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef<boolean>(true);
  // WebSocket 消息去重与合并
  const lastPayloadSignatureRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const latestDataRef = useRef<StatsResponse | null>(null);
  // 引用复用：uuid -> Server 对象映射与已排序数组
  const serverRefMap = useRef<Map<string, Server>>(new Map());
  const sortedServersRef = useRef<Server[]>([]);

  // 清理函数
  const cleanup = useCallback(() => {
    isMountedRef.current = false;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (wsCleanupRef.current) {
      wsCleanupRef.current();
      wsCleanupRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // 拉取 RPC snapshot 数据并填充初始列表
  const fetchRpcSnapshot = useCallback(async (): Promise<void> => {
    if (!useRpc) return;

    try {
      const snapshot = await getNodesSnapshot();
      const { nodes: nodesData, statuses: statusData } = snapshot;

      const nodesMap: Record<string, Client> = {};

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

      // 转换为 Server 对象并填充到 serverRefMap
      for (const [uuid, client] of Object.entries(nodesMap)) {
        const status = statusData[uuid];
        const server = convertClientToServer(client, status);
        serverRefMap.current.set(uuid, server);
      }

      // 排序并更新数据
      const list = Array.from(serverRefMap.current.values());
      sortedServersRef.current = sortServers(list);

      const updated: StatsResponse = {
        updated: Math.floor(Date.now() / 1000),
        servers: sortedServersRef.current,
      };

      setData(updated);
      setIsLoading(false);
      setError(null);

      if (process.env.NODE_ENV !== "production") {
        console.log("RPC snapshot loaded:", list.length, "servers");
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to fetch RPC snapshot:", error);
      }
    }
  }, [useRpc]);

  // 拉取节点基础信息（优先使用 RPC，失败时回退到 REST）
  const fetchNodes = useCallback(async (): Promise<void> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (useRpc) {
        // 使用 RPC 接口
        const nodesData = await getNodesInfo();
        const map = createNodesMap(nodesData);

        if (!controller.signal.aborted) {
          nodesMapRef.current = map;
          if (process.env.NODE_ENV !== "production") {
            console.log("RPC nodes loaded:", Object.keys(map).length);
          }
        }
      } else {
        // 回退到 REST API
        const res = await fetch("/api/nodes", { signal: controller.signal });
        if (!res.ok) return;
        const payload = await res.json();
        const map = createNodesMapFromRest(payload);

        if (!controller.signal.aborted) {
          nodesMapRef.current = map;
          if (process.env.NODE_ENV !== "production") {
            console.log("REST nodes loaded:", Object.keys(map).length);
          }
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Failed to fetch nodes:", error);
        }
        if (useRpc) {
          // RPC 失败，尝试回退到 REST
          setUseRpc(false);
        }
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [useRpc]);

  // WebSocket 连接和数据处理
  const connectWebSocket = useCallback(() => {
    const wsHandler = createWebSocketHandler(
      {
        enableWebSocket,
        refreshInterval,
        onConnected: () => {
          setIsConnected(true);
          setReconnectCount(0);
        },
        onDisconnected: () => {
          setIsConnected(false);
        },
        onError: (error) => {
          setError(error);
        },
        // 使用原始实时数据进行增量合并，维持引用稳定
        onRawMessage: (raw) => {
          const { records, online } = raw;

          // 增量更新：仅当字段变化时创建新对象
          let anyChanged = false;
          for (const uuid of Object.keys(records)) {
            const realtime: WsNodeRealtime = records[uuid] || {};
            const base: NodeBase =
              nodesMapRef.current[uuid] || ({ uuid } as NodeBase);
            const isOnline = online.includes(uuid);

            const prev = serverRefMap.current.get(uuid);
            if (prev) {
              // 计算下一版本
              const next = createServerFromRealtimeData(
                uuid,
                realtime,
                base,
                isOnline
              );
              // 字段级比较，若有差异则替换引用
              let changed = false;
              for (const k in next) {
                const key = k as keyof Server;
                if (next[key] !== prev[key]) {
                  changed = true;
                  break;
                }
              }
              if (changed) {
                serverRefMap.current.set(uuid, next);
                anyChanged = true;
              }
            } else {
              const created = createServerFromRealtimeData(
                uuid,
                realtime,
                base,
                isOnline
              );
              serverRefMap.current.set(uuid, created);
              anyChanged = true;
            }
          }

          // 维护排序结果：仅在有变化时重排
          if (anyChanged) {
            const list = Array.from(serverRefMap.current.values());
            sortedServersRef.current = sortServers(list);

            const updated: StatsResponse = {
              updated: Math.floor(Date.now() / 1000),
              servers: sortedServersRef.current,
            };

            // 帧内合并 setState
            latestDataRef.current = updated;
            if (rafIdRef.current === null) {
              rafIdRef.current = window.requestAnimationFrame(() => {
                const latest = latestDataRef.current;
                rafIdRef.current = null;
                if (!latest) return;
                setData(latest);
                setIsLoading(false);
                setError(null);
              });
            }
          }
        },
        // 兼容旧回调（后备路径）
        onMessage: (data) => {
          try {
            const signature = JSON.stringify(data?.servers ?? []);
            if (lastPayloadSignatureRef.current === signature) {
              return;
            }
            lastPayloadSignatureRef.current = signature;
          } catch {}
          latestDataRef.current = data;
          if (rafIdRef.current !== null) return;
          rafIdRef.current = window.requestAnimationFrame(() => {
            const latest = latestDataRef.current;
            rafIdRef.current = null;
            if (!latest) return;
            setData(latest);
            setIsLoading(false);
            setError(null);
          });
        },
        onReconnectAttempt: (count) => {
          setReconnectCount((prev) => prev + count);
        },
      },
      nodesMapRef,
      isMountedRef
    );

    wsHandler.connect();
    wsCleanupRef.current = wsHandler.cleanup;
  }, [enableWebSocket, refreshInterval]);

  // 手动刷新
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await fetchNodes();
    await fetchRpcSnapshot();
  }, [fetchNodes, fetchRpcSnapshot]);

  // 切换 RPC 模式
  const toggleRpc = useCallback(() => {
    setUseRpc((prev) => !prev);
  }, []);

  // 初始化
  useEffect(() => {
    fetchNodes();
    fetchRpcSnapshot();
    connectWebSocket();

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      cleanup();
    };
  }, [fetchNodes, fetchRpcSnapshot, connectWebSocket, cleanup]);

  // RPC 模式变化时重新获取节点信息
  useEffect(() => {
    fetchNodes();
  }, [useRpc, fetchNodes]);

  const contextValue: ServersContextValue = useMemo(
    () => ({
      data,
      isLoading,
      error,
      refresh,
      useRpc,
      toggleRpc,
      isConnected,
      reconnectCount,
    }),
    [
      data,
      isLoading,
      error,
      refresh,
      useRpc,
      toggleRpc,
      isConnected,
      reconnectCount,
    ]
  );

  const statusValue: ServersStatusValue = useMemo(
    () => ({ isConnected, reconnectCount }),
    [isConnected, reconnectCount]
  );

  return (
    <ServersStatusContext.Provider value={statusValue}>
      <ServersContext.Provider value={contextValue}>
        {children}
      </ServersContext.Provider>
    </ServersStatusContext.Provider>
  );
}

/**
 * 使用服务器数据的 Hook
 */
export function useServers(): ServersContextValue {
  const context = useContext(ServersContext);

  if (!context) {
    throw new Error("useServers must be used within a ServersProvider");
  }

  return context;
}

/**
 * 仅使用连接状态的 Hook（不会因数据更新而重渲染）
 */
export function useServersStatus(): ServersStatusValue {
  const context = useContext(ServersStatusContext);

  if (!context) {
    throw new Error("useServersStatus must be used within a ServersProvider");
  }

  return context;
}
