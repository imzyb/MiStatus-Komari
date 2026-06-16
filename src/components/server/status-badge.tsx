import React from 'react';

interface StatusBadgeProps {
  isOnline: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isOnline }) => (
  <span 
    className={`text-xs font-medium flex-shrink-0 ${
      isOnline 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-zinc-400 dark:text-zinc-500'
    }`}
    suppressHydrationWarning
  >
    {isOnline ? '在线' : '离线'}
  </span>
); 