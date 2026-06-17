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
      <div className="relative z-10">
        <CardContent className="flex items-center p-5">
          <div className="mr-3 flex items-center justify-center h-10 w-10 rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
            <div className="text-xl font-semibold text-foreground font-mono leading-tight">
              {value}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};