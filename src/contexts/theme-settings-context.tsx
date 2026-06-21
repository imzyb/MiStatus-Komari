'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useSiteInfo } from '@/contexts/site-info-context';
import { config } from '@/lib/config';

export interface ThemeSettings {
  showDashboard: boolean;
  showDetails: boolean;
  showAdminLink: boolean;
  cardColumns: number;
}

const DEFAULT_SETTINGS: ThemeSettings = {
  showDashboard: config.showDashboard,
  showDetails: config.showDetails,
  showAdminLink: config.showAdminLink,
  cardColumns: config.cardColumns,
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

type SettingType = 'boolean' | 'number';

const SETTING_META: Record<keyof ThemeSettings, { apiKey: string; type: SettingType }> = {
  showDashboard: { apiKey: 'show_dashboard', type: 'boolean' },
  showDetails: { apiKey: 'show_details', type: 'boolean' },
  showAdminLink: { apiKey: 'show_admin_link', type: 'boolean' },
  cardColumns: { apiKey: 'card_columns', type: 'number' },
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

function normalizeSettings(apiRecord: Record<string, unknown> | undefined | null): ThemeSettings {
  const result = { ...DEFAULT_SETTINGS };
  if (apiRecord) {
    for (const [key, meta] of Object.entries(SETTING_META)) {
      const val = apiRecord[meta.apiKey];
      if (val !== undefined && val !== null) {
        (result as Record<string, unknown>)[key] =
          meta.type === 'number' ? castNumber(val) : castBoolean(val);
      }
    }
  }
  return result as ThemeSettings;
}

export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const { siteInfo } = useSiteInfo();

  const [settings, setSettings] = useState<ThemeSettings>(() =>
    normalizeSettings(siteInfo?.theme_settings ?? null)
  );
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSettings(normalizeSettings(siteInfo?.theme_settings));
    setReady(true);
  }, [siteInfo?.theme_settings]);

  const updateSetting = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const ctx = useMemo(() => {
    const resolved = ready
      ? settings
      : { ...DEFAULT_SETTINGS, showDashboard: false, showDetails: false, showAdminLink: false } as ThemeSettings;
    return { settings: resolved, updateSetting, open, setOpen, ready };
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