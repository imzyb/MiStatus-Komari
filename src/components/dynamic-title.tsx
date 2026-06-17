'use client';

import { useEffect, useRef } from 'react';
import { useSiteInfo } from '@/contexts/site-info-context';

export function DynamicTitle() {
  const { siteInfo } = useSiteInfo();
  const initialTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteInfo?.sitename?.trim()) return;

    if (initialTitleRef.current === null) {
      initialTitleRef.current = document.title;
    }

    const title = siteInfo.sitename.trim();
    if (document.title !== title) {
      document.title = title;
    }
  }, [siteInfo]);

  return null;
}