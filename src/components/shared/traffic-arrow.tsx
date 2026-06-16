import React from "react";

export interface TrafficArrowProps {
  direction: "up" | "down";
  className?: string;
}

export const TrafficArrow: React.FC<TrafficArrowProps> = ({
  direction,
  className = "text-sm text-muted-foreground",
}) => <span className={className}>{direction === "down" ? "↓" : "↑"}</span>;
