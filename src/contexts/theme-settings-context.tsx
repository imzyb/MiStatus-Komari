'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { config } from '@/lib/config';

export interface ThemeSettings {
  showDashboard: boolean;
}

const DEFAULT_SETTINGS: ThemeSettings = {
  showDashboard: config.showDashboard,
};

const STORAGE_KEY = 'mistatus_settings';

interface ThemeSettingsContextValue {
  settings: ThemeSettings;
  updateSetting: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | null>(null);

function loadSettings(): ThemeSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: ThemeSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateSetting = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
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