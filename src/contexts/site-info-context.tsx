'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { getKomariPublicInfo } from '@/lib/api';

export interface SiteInfo {
  sitename?: string;
  description?: string;
}

export interface SiteInfoContextValue {
  /** 站点信息 */
  siteInfo: SiteInfo | null;
  /** 首次加载状态 */
  loading: boolean;
  /** 刷新/轮询状态 */
  isRefreshing: boolean;
  /** 错误信息 */
  error: string | null;
  /** 手动刷新站点信息 */
  refresh: () => Promise<void>;
  /** 上次更新时间 */
  lastUpdated: number | null;
}

const SiteInfoContext = createContext<SiteInfoContextValue | null>(null);

export interface SiteInfoProviderProps {
  children: React.ReactNode;
  /** 轮询间隔（毫秒），默认 5 分钟 */
  interval?: number;
  /** 请求超时（毫秒），默认 5 秒 */
  timeout?: number;
  /** 是否启用轮询，默认启用 */
  enablePolling?: boolean;
  /** 是否立即拉取一次，默认启用 */
  immediate?: boolean;
  /** 初始站点信息，避免重复请求 */
  initialData?: SiteInfo | null;
}

/**
 * 站点信息 Provider
 * 统一管理站点信息的获取、缓存和轮询，确保全局只有一个数据源
 */
export function SiteInfoProvider({
  children,
  interval = 5 * 60 * 1000,
  timeout = 5000,
  enablePolling = true,
  immediate = true,
  initialData = null
}: SiteInfoProviderProps) {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(initialData);
  const [loading, setLoading] = useState(!initialData && immediate);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(initialData ? Date.now() : null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRequestTokenRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchSiteInfo = useCallback(async (mode: 'initial' | 'refresh' = 'refresh'): Promise<void> => {
    const isInitialLoad = mode === 'initial';

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const requestToken = Date.now();
    currentRequestTokenRef.current = requestToken;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);
    timeoutRef.current = timeoutId;

    try {
      const response = await getKomariPublicInfo();

      if (response.status === 'success' && response.data) {
        setSiteInfo(response.data);
        setLastUpdated(Date.now());
        setError(null);
      } else {
        setError(response.message || '获取站点信息失败');
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        const message = err instanceof Error ? err.message : '未知错误';
        setError(message);
        if (process.env.NODE_ENV === 'development') {
          console.debug('获取站点信息失败:', err);
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.debug('站点信息请求被取消');
      }
    } finally {
      clearTimeout(timeoutId);
      if (timeoutRef.current === timeoutId) {
        timeoutRef.current = null;
      }

      if (currentRequestTokenRef.current === requestToken) {
        if (isInitialLoad) {
          setLoading(false);
        } else {
          setIsRefreshing(false);
        }
        currentRequestTokenRef.current = null;

        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    }
  }, [timeout]);

  const refresh = useCallback(async (): Promise<void> => {
    const mode = siteInfo === null ? 'initial' : 'refresh';
    await fetchSiteInfo(mode);
  }, [fetchSiteInfo, siteInfo]);

  const setupPolling = useCallback(() => {
    if (!enablePolling) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      fetchSiteInfo('refresh');
    }, interval);
  }, [enablePolling, interval, fetchSiteInfo]);

  useEffect(() => {
    if (immediate && !initialData) {
      fetchSiteInfo('initial');
    }

    setupPolling();

    return () => {
      cleanup();
    };
  }, [immediate, fetchSiteInfo, setupPolling, cleanup, initialData]);

  useEffect(() => {
    if (initialData) {
      setSiteInfo(initialData);
      setLastUpdated(Date.now());
      setLoading(false);
      setError(null);
    }
  }, [initialData]);

  const contextValue: SiteInfoContextValue = useMemo(() => ({
    siteInfo,
    loading,
    isRefreshing,
    error,
    refresh,
    lastUpdated
  }), [siteInfo, loading, isRefreshing, error, refresh, lastUpdated]);

  return (
    <SiteInfoContext.Provider value={contextValue}>
      {children}
    </SiteInfoContext.Provider>
  );
}

/**
 * 使用站点信息的 Hook
 */
export function useSiteInfo(): SiteInfoContextValue {
  const context = useContext(SiteInfoContext);

  if (!context) {
    throw new Error('useSiteInfo must be used within a SiteInfoProvider');
  }

  return context;
}
