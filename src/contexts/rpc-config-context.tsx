"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { RpcAdapter, RpcAdapterConfig } from "@/lib/rpc-adapter";

export interface RpcConfigContextValue {
  /** RPC 适配器实例 */
  adapter: RpcAdapter;
  /** 是否启用 RPC */
  enabled: boolean;
  /** 是否启用双写模式 */
  dualWrite: boolean;
  /** 是否启用回退机制 */
  fallback: boolean;
  /** 切换 RPC 启用状态 */
  toggleEnabled: () => void;
  /** 切换双写模式 */
  toggleDualWrite: () => void;
  /** 切换回退机制 */
  toggleFallback: () => void;
  /** 更新配置 */
  updateConfig: (config: Partial<RpcAdapterConfig>) => void;
  /** 重置为默认配置 */
  resetConfig: () => void;
}

const RpcConfigContext = createContext<RpcConfigContextValue | null>(null);

export interface RpcConfigProviderProps {
  children: React.ReactNode;
  /** 初始配置 */
  initialConfig?: Partial<RpcAdapterConfig>;
}

/**
 * RPC 配置 Provider
 * 管理 RPC 适配器的配置和状态
 */
export function RpcConfigProvider({
  children,
  initialConfig,
}: RpcConfigProviderProps) {
  // 使用 useRef 缓存初始配置，避免每次渲染时重新创建对象
  const initialConfigRef = useRef<Partial<RpcAdapterConfig>>(
    initialConfig ?? {}
  );

  const [enabled, setEnabled] = useState(
    initialConfigRef.current.enabled ?? true
  );
  const [dualWrite, setDualWrite] = useState(
    initialConfigRef.current.dualWrite ?? false
  );
  const [fallback, setFallback] = useState(
    initialConfigRef.current.fallback ?? true
  );

  // 使用 useRef 缓存 RpcAdapter 实例，避免不必要的重建
  const adapterRef = useRef<RpcAdapter | null>(null);
  if (!adapterRef.current) {
    adapterRef.current = new RpcAdapter({
      enabled,
      dualWrite,
      fallback,
      ...initialConfigRef.current,
    });
  }

  const adapter = adapterRef.current!;

  // 当状态改变时，更新适配器配置而不是重建实例
  useEffect(() => {
    adapter.updateConfig({
      enabled,
      dualWrite,
      fallback,
    });
  }, [adapter, enabled, dualWrite, fallback]);

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  const toggleDualWrite = useCallback(() => {
    setDualWrite((prev) => !prev);
  }, []);

  const toggleFallback = useCallback(() => {
    setFallback((prev) => !prev);
  }, []);

  const updateConfig = useCallback(
    (config: Partial<RpcAdapterConfig>) => {
      if (config.enabled !== undefined) setEnabled(config.enabled);
      if (config.dualWrite !== undefined) setDualWrite(config.dualWrite);
      if (config.fallback !== undefined) setFallback(config.fallback);
      // 其他配置项直接更新适配器
      if (config.rpcClient !== undefined) {
        adapter.updateConfig({ rpcClient: config.rpcClient });
      }
    },
    [adapter]
  );

  const resetConfig = useCallback(() => {
    setEnabled(true);
    setDualWrite(false);
    setFallback(true);
    // useEffect 会自动处理适配器配置更新
  }, []);

  const contextValue: RpcConfigContextValue = useMemo(
    () => ({
      adapter,
      enabled,
      dualWrite,
      fallback,
      toggleEnabled,
      toggleDualWrite,
      toggleFallback,
      updateConfig,
      resetConfig,
    }),
    [
      adapter,
      enabled,
      dualWrite,
      fallback,
      toggleEnabled,
      toggleDualWrite,
      toggleFallback,
      updateConfig,
      resetConfig,
    ]
  );

  return (
    <RpcConfigContext.Provider value={contextValue}>
      {children}
    </RpcConfigContext.Provider>
  );
}

/**
 * 使用 RPC 配置的 Hook
 */
export function useRpcConfig(): RpcConfigContextValue {
  const context = useContext(RpcConfigContext);

  if (!context) {
    throw new Error("useRpcConfig must be used within a RpcConfigProvider");
  }

  return context;
}
