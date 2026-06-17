'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon, MonitorIcon } from '@/components/ui/theme-icons';

interface ClientThemeToggleProps {
  className?: string;
}

export const ClientThemeToggle: React.FC<ClientThemeToggleProps> = ({ className }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = React.useCallback(() => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  }, [theme, setTheme]);

  const label = React.useMemo(() => {
    if (theme === 'system') {
      return '跟随系统';
    }
    return resolvedTheme === 'dark' ? '暗色模式' : '浅色模式';
  }, [theme, resolvedTheme]);

  const icon = React.useMemo(() => {
    if (theme === 'system') {
      return <MonitorIcon />;
    }
    return resolvedTheme === 'dark' ? <MoonIcon /> : <SunIcon />;
  }, [theme, resolvedTheme]);

  const baseClass = 'inline-flex h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors';

  if (!mounted) {
    return (
      <span
        aria-hidden
        className={`${baseClass} opacity-0 ${className || ''}`}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`当前主题: ${label}`}
      className={`${baseClass} ${className || ''}`}
      onClick={cycleTheme}
      title={`当前主题: ${label}`}
    >
      <span className="transition-transform duration-300 hover:scale-110">
        {icon}
      </span>
      <span className="sr-only">切换主题（当前: {label}）</span>
    </button>
  );
};
