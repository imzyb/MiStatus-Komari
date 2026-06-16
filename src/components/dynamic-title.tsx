'use client';

import { useEffect } from 'react';
import { useSiteInfo } from '@/contexts/site-info-context';

export function DynamicTitle({ fallbackTitle = 'MiStatus Monitor' }: { fallbackTitle?: string }) {
  const { siteInfo } = useSiteInfo();

  useEffect(() => {
    const title = siteInfo?.sitename?.trim() || fallbackTitle;
    if (document.title !== title) {
      document.title = title;
    }
  }, [siteInfo, fallbackTitle]);

  return null;
}
