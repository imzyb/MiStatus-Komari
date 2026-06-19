'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useSiteInfo } from '@/contexts/site-info-context';
import { config } from '@/lib/config';

export interface ThemeSettings {
  showDashboard: boolean;
  showDetails: boolean;
  showAdminLink: boolean;
}

const DEFAULT_SETTINGS: ThemeSettings = {
  showDashboard: config.showDashboard,
  showDetails: config.showDetails,
  showAdminLink: config.showAdminLink,
};

interface ThemeSettingsContextValue {
  settings: ThemeSettings;
  updateSetting: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | null>(null);

function normalizeSettings(apiRecord: Record<string, unknown> | undefined | null): ThemeSettings {
  const result = { ...DEFAULT_SETTINGS };
  if (apiRecord) {
    for (const [key, apiKey] of Object.entries(API_KEY_MAP)) {
      const val = apiRecord[apiKey];
      if (val !== undefined && val !== null) {
        (result as Record<string, unknown>)[key] = castBoolean(val);
      }
    }
  }
  return result as ThemeSettings;
}

const API_KEY_MAP: Record<keyof ThemeSettings, string> = {
  showDashboard: 'show_dashboard',
  showDetails: 'show_details',
  showAdminLink: 'show_admin_link',
};

function castBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() !== "false" && v !== "0";
  if (typeof v === "number") return v !== 0;
  return false;
}

export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const { siteInfo } = useSiteInfo();

  const [settings, setSettings] = useState<ThemeSettings>(() =>
    normalizeSettings(siteInfo?.theme_settings ?? null)
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSettings(normalizeSettings(siteInfo?.theme_settings));
  }, [siteInfo?.theme_settings]);

  const updateSetting = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const ctx = useMemo(() => ({ settings, updateSetting, open, setOpen }), [settings, updateSetting, open]);

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