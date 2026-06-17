import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

interface IconProps { className?: string }

export const MoonIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <Moon className={className} />
);

export const SunIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <Sun className={className} />
);

export const MonitorIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <Monitor className={className} />
);