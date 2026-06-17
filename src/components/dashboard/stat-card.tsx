'use client';

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { useAnimatedNumber } from '@/hooks/use-animated-number';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  className,
  onClick,
}) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden shadow-sm transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center p-4">
        <div className="mr-3 flex items-center justify-center h-10 w-10 rounded-2xl bg-primary/10 dark:bg-primary/15 text-primary">
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

export interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, suffix, className }) => {
  const animated = useAnimatedNumber(value);
  return (
    <span className={className}>
      {animated}{suffix}
    </span>
  );
};