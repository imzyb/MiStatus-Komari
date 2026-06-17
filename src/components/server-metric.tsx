"use client";

import React from "react";
import { formatPercent } from "@/lib/utils";
import { clampPercent } from "@/lib/server-load-chart";

interface ServerMetricProps {
  label: string;
  value: number;
  total: number;
  unit?: string;
  formatter?: (value: number) => string;
}

const colors = {
  safe: {
    bar: "bg-trading-up",
    text: "text-trading-up",
  },
  warning: {
    bar: "bg-accent",
    text: "text-accent",
  },
  danger: {
    bar: "bg-trading-down",
    text: "text-trading-down",
  },
  disabled: {
    bar: "bg-muted-foreground/20",
    text: "text-muted-foreground",
  },
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

    // 根据百分比确定颜色主题 - 使用 useMemo 缓存计算
    const colorTheme = React.useMemo(() => {
      if (isUnconfigured) {
        return colors.disabled;
      } else if (percent >= 90) {
        return colors.danger;
      } else if (percent >= 70) {
        return colors.warning;
      } else {
        return colors.safe;
      }
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
            className={`absolute left-0 top-0 h-full ${colorTheme.bar} rounded-full transition-[width] duration-200 ease-out shadow-sm`}
            style={progressStyle}
          />
        </div>
      </div>
    );
  }
);
ServerMetric.displayName = "ServerMetric";
