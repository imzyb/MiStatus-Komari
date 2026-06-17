'use client';

import React from 'react';
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
  title, value, icon, className, onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border border-hairline/80 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-sm flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground/80 leading-tight">{title}</p>
            <div className="text-lg font-bold text-foreground font-mono leading-tight mt-0.5">
              {value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, suffix, className }) => {
  const animated = useAnimatedNumber(value);
  return <span className={className}>{animated}{suffix}</span>;
};