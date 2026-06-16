'use client';

import { useEffect } from 'react';
import { useSiteInfo } from '@/contexts/site-info-context';

interface DynamicTitleProps {
  fallbackTitle?: string;
  fallbackDescription?: string;
}

/**
 * 动态更新页面标题和 meta 标签的客户端组件
 * 使用 useSiteInfo hook 从 /api/public 获取站点信息
 */
export function DynamicTitle({
  fallbackTitle = 'Komari Monitor',
  fallbackDescription = 'A simple server monitor tool.'
}: DynamicTitleProps) {
  const { siteInfo } = useSiteInfo();

  useEffect(() => {
    // 更新 document.title
    const title = siteInfo?.sitename?.trim() || fallbackTitle;
    document.title = title;

    // 更新 meta description
    const description = siteInfo?.description?.trim() || fallbackDescription;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      // 如果不存在 meta description，创建一个
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [siteInfo, fallbackTitle, fallbackDescription]);

  // 这个组件不渲染任何内容
  return null;
}
