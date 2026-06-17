'use client';

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  className
}) => {
  return (
    <Card className={cn("relative overflow-hidden shadow-sm", className)}>
      <CardContent className="flex items-center p-4">
        <div className="mr-3 flex items-center justify-center h-10 w-10 rounded-2xl bg-primary/8 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground leading-tight">{title}</p>
          <div className="text-lg font-semibold text-foreground font-mono leading-tight mt-0.5">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};