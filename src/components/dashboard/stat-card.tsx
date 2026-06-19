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
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }, [onClick]);

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border border-hairline/80 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground leading-tight">{title}</p>
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
  const animated = useAnimatedNumber(value, 400, 1);
  return <span className={className}>{animated}{suffix}</span>;
};