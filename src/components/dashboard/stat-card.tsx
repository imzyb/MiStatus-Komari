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
    <Card 
      className={cn(`relative overflow-hidden border bg-card`, className)}
    >
      <div className="relative z-10">
        <CardContent className="flex items-center p-6">
          <div className="mr-3 text-muted-foreground">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold text-foreground">
              {value}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}; 