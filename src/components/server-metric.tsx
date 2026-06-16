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
    bar: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  },
  warning: {
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  disabled: {
    bar: "bg-zinc-300 dark:bg-zinc-600",
    text: "text-zinc-400 dark:text-zinc-500",
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
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">{label}</span>
            {!isUnconfigured && (
              <span
                className={`text-xs font-semibold ${colorTheme.text}`}
                suppressHydrationWarning
              >
                {percent}%
              </span>
            )}
          </div>
          <span
            className="text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            {isUnconfigured
              ? "未配置"
              : `${formattedValue}${unit} / ${formattedTotal}${unit}`}
          </span>
        </div>
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`absolute left-0 top-0 h-full ${colorTheme.bar} rounded-full transition-all duration-300 ease-out`}
            style={progressStyle}
          />
        </div>
      </div>
    );
  }
);
ServerMetric.displayName = "ServerMetric";
