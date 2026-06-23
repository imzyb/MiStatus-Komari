'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useSiteInfo, type SiteInfo } from '@/contexts/site-info-context';
import { config } from '@/lib/config';

export interface ThemeSettings {
  showDashboard: boolean;
  showDetails: boolean;
  showAdminLink: boolean;
  cardColumns: number;
  showFooter: boolean;
  footerContent: string;
}

const DEFAULT_SETTINGS: ThemeSettings = {
  showDashboard: config.showDashboard,
  showDetails: config.showDetails,
  showAdminLink: config.showAdminLink,
  cardColumns: config.cardColumns,
  showFooter: config.showFooter,
  footerContent: config.footerContent,
};

interface ThemeSettingsContextValue {
  settings: ThemeSettings;
  updateSetting: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  /** 是否已从服务端加载完成 */
  ready: boolean;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | null>(null);

type SettingType = 'boolean' | 'number' | 'string';

const SETTING_META: Record<keyof ThemeSettings, { apiKey: string; type: SettingType }> = {
  showDashboard: { apiKey: 'show_dashboard', type: 'boolean' },
  showDetails: { apiKey: 'show_details', type: 'boolean' },
  showAdminLink: { apiKey: 'show_admin_link', type: 'boolean' },
  cardColumns: { apiKey: 'card_columns', type: 'number' },
  showFooter: { apiKey: 'show_footer', type: 'boolean' },
  footerContent: { apiKey: 'footer_content', type: 'string' },
};

function castBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() !== "false" && v !== "0";
  if (typeof v === "number") return v !== 0;
  return false;
}

function castNumber(v: unknown): number {
  if (typeof v === "number") return Math.max(1, Math.min(Math.round(v), 8));
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return isNaN(n) ? DEFAULT_SETTINGS.cardColumns : Math.max(1, Math.min(n, 8));
  }
  return DEFAULT_SETTINGS.cardColumns;
}

function castString(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

function normalizeSettings(apiRecord: Record<string, unknown> | undefined | null): ThemeSettings {
  const result = { ...DEFAULT_SETTINGS };
  if (apiRecord) {
    for (const [key, meta] of Object.entries(SETTING_META)) {
      const val = apiRecord[meta.apiKey];
      if (val !== undefined && val !== null) {
        if (meta.type === 'number') {
          (result as Record<string, unknown>)[key] = castNumber(val);
        } else if (meta.type === 'string') {
          (result as Record<string, unknown>)[key] = castString(val);
        } else {
          (result as Record<string, unknown>)[key] = castBoolean(val);
        }
      }
    }
  }
  return result as ThemeSettings;
}

const CACHE_KEY = "mistatus_theme_settings_cache";

function loadCachedSettings(): ThemeSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function getInitialSettings(siteInfo: SiteInfo | null): ThemeSettings {
  if (siteInfo?.theme_settings) return normalizeSettings(siteInfo.theme_settings);
  const cached = loadCachedSettings();
  if (cached) return cached;
  return DEFAULT_SETTINGS;
}

export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const { siteInfo } = useSiteInfo();

  const [settings, setSettings] = useState<ThemeSettings>(() => getInitialSettings(siteInfo));
  const [ready, setReady] = useState(() => !!(siteInfo?.theme_settings || loadCachedSettings()));
  const [open, setOpen] = useState(false);

  // 当网络 API 站点配置返回后，静默同步并更新缓存
  useEffect(() => {
    if (siteInfo?.theme_settings) {
      const latest = normalizeSettings(siteInfo.theme_settings);
      setSettings(latest);
      setReady(true);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(latest));
      } catch {
        // 忽略缓存写入错误
      }
    } else if (siteInfo) {
      setReady(true);
    }
  }, [siteInfo]);

  const updateSetting = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {
        // 忽略写入错误
      }
      return next;
    });
  }, []);

  const ctx = useMemo(() => {
    return { settings, updateSetting, open, setOpen, ready };
  }, [settings, ready, updateSetting, open, setOpen]);

  return (
    <ThemeSettingsContext.Provider value={ctx}>
      {children}
    </ThemeSettingsContext.Provider>
  );
}

export function useThemeSettings(): ThemeSettingsContextValue {
  const ctx = useContext(ThemeSettingsContext);
  if (!ctx) throw new Error('useThemeSettings must be used within ThemeSettingsProvider');
  return ctx;
}