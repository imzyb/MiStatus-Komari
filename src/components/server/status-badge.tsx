import React from 'react';

interface StatusBadgeProps {
  isOnline: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isOnline }) => (
  <span 
    className={`text-xs font-medium flex-shrink-0 ${
      isOnline 
        ? 'text-trading-up' 
        : 'text-muted-foreground'
    }`}
    suppressHydrationWarning
  >
    {isOnline ? '在线' : '离线'}
  </span>
); 