'use client';

import { useThemeSettings } from '@/contexts/theme-settings-context';

const MIN_COLS = 1;
const MAX_COLS = 8;

export function useCardColumns(): number {
  const { settings } = useThemeSettings();
  return Math.max(MIN_COLS, Math.min(settings.cardColumns, MAX_COLS));
}

export function gridColumnStyle(cols: number): React.CSSProperties {
  return {
    gridTemplateColumns: `repeat(${Math.max(MIN_COLS, Math.min(cols, MAX_COLS))}, minmax(0, 1fr))`,
  };
}
