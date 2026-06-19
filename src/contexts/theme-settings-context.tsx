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

const STORAGE_KEY = 'mistatus_settings';

interface ThemeSettingsContextValue {
  settings: ThemeSettings;
  updateSetting: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | null>(null);

function loadLocalOverrides(): Partial<ThemeSettings> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

const API_KEY_MAP: Record<keyof ThemeSettings, string> = {
  showDashboard: 'show_dashboard',
  showDetails: 'show_details',
  showAdminLink: 'show_admin_link',
};

function mergeSettings(apiRecord: Record<string, unknown> | undefined | null): ThemeSettings {
  const apiPart: Partial<ThemeSettings> = {};
  if (apiRecord) {
    for (const [key, apiKey] of Object.entries(API_KEY_MAP)) {
      const val = apiRecord[apiKey];
      if (val !== undefined && val !== null) {
        (apiPart as Record<string, unknown>)[key] = val;
      }
    }
  }
  const localPart = loadLocalOverrides();
  return { ...DEFAULT_SETTINGS, ...apiPart, ...localPart };
}

export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const { siteInfo } = useSiteInfo();
  const [merged, setMerged] = useState<ThemeSettings>(() => mergeSettings(null));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMerged(mergeSettings(siteInfo?.theme_settings));
  }, [siteInfo?.theme_settings]);

  const updateSetting = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setMerged((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const ctx = useMemo(() => ({ settings: merged, updateSetting, open, setOpen }), [merged, updateSetting, open]);

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