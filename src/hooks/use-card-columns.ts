'use client';

import { useThemeSettings } from '@/contexts/theme-settings-context';

const MIN_COLS = 1;
const MAX_COLS = 8;

export function useCardColumns(): number {
  const { settings } = useThemeSettings();
  return Math.max(MIN_COLS, Math.min(settings.cardColumns, MAX_COLS));
}

/**
 * 返回响应式网格列 className
 * 移动端固定1列，sm以上使用后台设置值
 */
export function useCardGridClassName(): string {
  const cols = useCardColumns();
  const clamped = Math.max(MIN_COLS, Math.min(cols, MAX_COLS));
  if (clamped <= 1) return 'server-grid';
  return `server-grid server-grid-cols-${clamped}`;
}
