import React from 'react';

interface StatusIndicatorProps { isOnline: boolean; }

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isOnline }) => (
  <div className={`h-2 w-2 rounded-full flex-shrink-0 transition-colors ${
    isOnline ? 'bg-trading-up shadow-[0_0_4px_rgba(0,181,120,0.3)]' : 'bg-muted-foreground/30'
  }`} />
);