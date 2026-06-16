import type { StatsResponse, Server } from "./api";
import type { NodeBase, WsNodeRealtime } from "./node-helpers";
import { createServerFromRealtimeData } from "./node-helpers";

/**
 * WebSocket 消息载荷类型
 */
export interface WsPayload {
  data?: {
    online?: string[];
    data?: Record<string, WsNodeRealtime>;
  };
  status?: string;
}

/**
 * 原始实时载荷（不构建 Server 对象）
 */
export interface WsRealtimeRawPayload {
  updated: number;
  records: Record<string, WsNodeRealtime>;
  online: string[];
}

/**
 * 解析 WebSocket 消息并转换为 StatsResponse
 * @param messageData WebSocket 消息数据
 * @param nodesMap 节点基础信息映射
 * @returns StatsResponse 或 null（解析失败时）
 */
export function parseWebSocketMessage(
  messageData: string,
  nodesMap: Record<string, NodeBase>
): StatsResponse | null {
  try {
    const msg: WsPayload = JSON.parse(messageData || "{}") as WsPayload;

    const online: string[] = Array.isArray(msg?.data?.online)
      ? (msg!.data!.online as string[])
      : [];

    const records: Record<string, WsNodeRealtime> =
      msg?.data?.data && typeof msg.data.data === "object"
        ? (msg.data.data as Record<string, WsNodeRealtime>)
        : {};

    const nowSec = Math.floor(Date.now() / 1000);

    const servers: Server[] = Object.keys(records).map((uuid) => {
      const rec: WsNodeRealtime = records[uuid] || {};
      const base: NodeBase = nodesMap[uuid] || ({ uuid } as NodeBase);
      const isOnline = online.includes(uuid);

      return createServerFromRealtimeData(uuid, rec, base, isOnline);
    });

    return { updated: nowSec, servers };
  } catch {
    // 解析失败时返回 null
    return null;
  }
}

/**
 * 解析 WebSocket 消息为原始结构（records 与 online），供上层自行合并与构建
 */
export function parseWebSocketMessageRaw(
  messageData: string
): WsRealtimeRawPayload | null {
  try {
    const msg: WsPayload = JSON.parse(messageData || "{}") as WsPayload;
    const online: string[] = Array.isArray(msg?.data?.online)
      ? (msg!.data!.online as string[])
      : [];
    const records: Record<string, WsNodeRealtime> =
      msg?.data?.data && typeof msg.data.data === "object"
        ? (msg.data.data as Record<string, WsNodeRealtime>)
        : {};
    const nowSec = Math.floor(Date.now() / 1000);
    return { updated: nowSec, records, online };
  } catch {
    return null;
  }
}

/**
 * 构建 WebSocket URL
 * @returns WebSocket URL
 */
export function buildWebSocketUrl(): string {
  const protocol =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "wss:"
      : "ws:";
  const host = typeof window !== "undefined" ? window.location.host : "";
  return `${protocol}//${host}/api/clients`;
}

/**
 * WebSocket 连接配置
 */
export interface WebSocketConfig {
  enableWebSocket: boolean;
  refreshInterval: number;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (error: Error) => void;
  onMessage: (data: StatsResponse) => void;
  onReconnectAttempt: (count: number) => void;
  /**
   * 可选：提供原始实时数据回调以便上层合并与引用复用
   */
  onRawMessage?: (data: WsRealtimeRawPayload) => void;
}

/**
 * 创建 WebSocket 连接处理器
 * @param config WebSocket 配置
 * @param nodesMapRef 节点映射引用
 * @param isMountedRef 组件挂载状态引用
 * @returns WebSocket 连接处理器
 */
export function createWebSocketHandler(
  config: WebSocketConfig,
  nodesMapRef: React.MutableRefObject<Record<string, NodeBase>>,
  isMountedRef: React.MutableRefObject<boolean>
) {
  let ws: WebSocket | null = null;
  let timer: number | null = null;
  let reconnectTimeout: number | null = null;
  let lastSendMs: number = 0;
  let visibilityListenerAdded = false;
  let focusListenerAdded = false;

  const getMinSendGap = (): number => {
    // 使用刷新间隔的一半作为最小发送间隔，下限 500ms，避免在前台事件触发时过于频繁发送
    const halfInterval = Math.floor((config.refreshInterval || 0) * 0.5);
    return Math.max(500, halfInterval || 500);
  };

  const isDocumentVisible = (): boolean => {
    if (typeof document === "undefined") return true;
    return document.visibilityState === "visible";
  };

  const isWindowFocused = (): boolean => {
    if (typeof document === "undefined" || typeof window === "undefined")
      return true;
    try {
      return document.hasFocus();
    } catch {
      return true;
    }
  };

  const isActive = (): boolean => isDocumentVisible() && isWindowFocused();

  const trySendGetThrottled = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!isActive()) return;

    const now = Date.now();
    const gap = now - lastSendMs;
    if (gap < getMinSendGap()) return;

    try {
      ws.send("get");
      lastSendMs = now;
    } catch {}
  };

  const startActiveTimer = () => {
    if (timer) clearInterval(timer);
    // 仅在前台活跃时轮询
    if (isActive()) {
      timer = window.setInterval(() => {
        trySendGetThrottled();
      }, config.refreshInterval);
    } else {
      timer = null;
    }
  };

  const stopActiveTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const cleanup = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (visibilityListenerAdded && typeof document !== "undefined") {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange as EventListener
      );
      visibilityListenerAdded = false;
    }
    if (focusListenerAdded && typeof window !== "undefined") {
      window.removeEventListener("focus", handleFocus, true);
      window.removeEventListener("blur", handleBlur, true);
      focusListenerAdded = false;
    }
    if (ws) {
      try {
        ws.close();
      } catch {}
      ws = null;
    }
  };

  const handleVisibilityChange = () => {
    if (!isMountedRef.current) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (isActive()) {
      // 回到前台：立即尝试一次（受节流保护），并恢复定时器
      trySendGetThrottled();
      startActiveTimer();
    } else {
      // 进入后台：停止定时器，避免后台频繁请求
      stopActiveTimer();
    }
  };

  const handleFocus = () => {
    if (!isMountedRef.current) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    // 获取焦点时尝试一次并确保定时器处于活跃模式
    trySendGetThrottled();
    startActiveTimer();
  };

  const handleBlur = () => {
    if (!isMountedRef.current) return;
    // 失去焦点时，如果页面不可见或整体不活跃，则停止定时器
    if (!isActive()) {
      stopActiveTimer();
    }
  };

  const connect = () => {
    if (!config.enableWebSocket) return;

    try {
      ws = new WebSocket(buildWebSocketUrl());

      ws.onopen = () => {
        if (!isMountedRef.current) return;

        config.onConnected();

        // 前台主动取一次（受节流保护）
        trySendGetThrottled();

        // 仅在前台活跃时轮询
        startActiveTimer();

        // 绑定前台可见性与焦点监听
        if (typeof document !== "undefined" && !visibilityListenerAdded) {
          document.addEventListener(
            "visibilitychange",
            handleVisibilityChange as EventListener
          );
          visibilityListenerAdded = true;
        }
        if (typeof window !== "undefined" && !focusListenerAdded) {
          window.addEventListener("focus", handleFocus, true);
          window.addEventListener("blur", handleBlur, true);
          focusListenerAdded = true;
        }
      };

      ws.onmessage = (evt) => {
        if (!isMountedRef.current) return;

        // 优先向上层提供原始消息，便于引用复用；否则回退到构建 Server 的旧路径
        if (typeof config.onRawMessage === "function") {
          const raw = parseWebSocketMessageRaw(String(evt.data || "{}"));
          if (raw) {
            config.onRawMessage(raw);
            return;
          }
        }

        const parsedData = parseWebSocketMessage(
          String(evt.data || "{}"),
          nodesMapRef.current
        );

        if (parsedData) {
          config.onMessage(parsedData);
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        config.onError(new Error("WebSocket error"));
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;

        config.onDisconnected();

        if (timer) {
          clearInterval(timer);
          timer = null;
        }

        // 指数回退或固定短暂重连
        reconnectTimeout = window.setTimeout(() => {
          if (!isMountedRef.current) return;

          if (ws === ws) {
            ws = null;
          }
          config.onReconnectAttempt(1);
          connect();
        }, 1500);
      };
    } catch {
      // 构建失败，稍后重试
      if (!isMountedRef.current) return;

      config.onError(new Error("WebSocket connect failed"));
      reconnectTimeout = window.setTimeout(() => {
        if (!isMountedRef.current) return;
        connect();
      }, 1500);
    }
  };

  return {
    connect,
    cleanup,
    send: (message: string) => {
      try {
        ws?.send(message);
      } catch {}
    },
  };
}
