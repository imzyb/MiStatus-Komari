"use client";

import React from "react";
import { formatPercent, getThresholdColor } from "@/lib/utils";
import { clampPercent } from "@/lib/server-load-chart";

interface ServerMetricProps {
  label: string;
  value: number;
  total: number;
  unit?: string;
  formatter?: (value: number) => string;
}

const disabledColor = {
  bar: "bg-muted-foreground/20",
  text: "text-muted-foreground",
};

export const ServerMetric: React.FC<ServerMetricProps> = React.memo(
  function ServerMetric({
    label,
    value,
    total,
    unit = "",
    formatter = (val: number) => val.toString(),
  }) {
    const percent = formatPercent(value, total);
    const formattedValue = formatter(value);
    const formattedTotal = formatter(total);

    // 检查未配置状态（例如SWAP为0）
    const isUnconfigured = formattedValue === "未配置";

    // 根据百分比确定颜色主题
    const colorTheme = React.useMemo(() => {
      if (isUnconfigured) return disabledColor;
      return getThresholdColor(percent);
    }, [percent, isUnconfigured]);

    // 缓存样式字符串
    const progressStyle = React.useMemo(
      () => ({
        width: isUnconfigured ? "0%" : `${clampPercent(percent)}%`,
      }),
      [percent, isUnconfigured]
    );

    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-foreground/80">{label}</span>
            {!isUnconfigured && (
              <span
                className={`text-[11px] font-semibold ${colorTheme.text}`}
                suppressHydrationWarning
              >
                {percent}%
              </span>
            )}
          </div>
          <span
            className="text-[11px] text-muted-foreground"
            suppressHydrationWarning
          >
            {isUnconfigured
              ? "未配置"
              : `${formattedValue}${unit} / ${formattedTotal}${unit}`}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`absolute left-0 top-0 h-full ${colorTheme.bar} rounded-full transition-[width] duration-300 ease-out shadow-sm`}
            style={progressStyle}
          />
        </div>
      </div>
    );
  }
);
ServerMetric.displayName = "ServerMetric";
