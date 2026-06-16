import React from 'react';

interface StatusIndicatorProps {
  isOnline: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isOnline }) => (
  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
    isOnline ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
  }`} />
); 