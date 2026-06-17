import React from "react";

export interface TrafficArrowProps {
  direction: "up" | "down";
  className?: string;
}

export const TrafficArrow: React.FC<TrafficArrowProps> = ({
  direction,
  className,
}) => (
  <span
    className={
      className ||
      (direction === "down"
        ? "text-sm text-trading-down"
        : "text-sm text-trading-up")
    }
  >
    {direction === "down" ? "↓" : "↑"}
  </span>
);
