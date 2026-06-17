import React from 'react';
import { Clock } from 'lucide-react';

export interface LastUpdatedProps { timestamp: string; }

export const LastUpdated: React.FC<LastUpdatedProps> = ({ timestamp }) => (
  <div className="text-[11px] text-muted-foreground flex items-center px-2.5 py-1 rounded-full bg-muted/50">
    <Clock className="h-3 w-3 mr-1" />
    <span suppressHydrationWarning>{timestamp}</span>
  </div>
);