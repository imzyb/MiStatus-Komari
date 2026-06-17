import React from 'react';
import { Clock } from 'lucide-react';

export interface LastUpdatedProps {
  timestamp: string;
}

export const LastUpdated: React.FC<LastUpdatedProps> = ({ timestamp }) => (
  <div className="text-xs text-muted-foreground flex items-center px-2.5 py-1 rounded-md border bg-muted">
    <Clock className="h-3 w-3 mr-1.5 text-muted-foreground" />
    <span suppressHydrationWarning>更新于 {timestamp}</span>
  </div>
); 