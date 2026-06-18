"use client";

import React from "react";
import { X } from "lucide-react";
import { useThemeSettings } from "@/contexts/theme-settings-context";

export const ThemeSettingsDrawer: React.FC = React.memo(
  function ThemeSettingsDrawer() {
    const { settings, updateSetting, open, setOpen } = useThemeSettings();

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
        <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
        <div className="relative w-full max-w-sm bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up p-5 mx-0 sm:mx-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">主题设置</h2>
            <button type="button" onClick={() => setOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">监控概览</p>
                <p className="text-xs text-muted-foreground">显示/隐藏顶部的监控统计卡片</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.showDashboard}
                onClick={() => updateSetting("showDashboard", !settings.showDashboard)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  settings.showDashboard ? "bg-primary" : "bg-muted"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                  settings.showDashboard ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/50 text-center mt-6">设置自动保存，清除浏览器数据会重置</p>
        </div>
      </div>
    );
  }
);
ThemeSettingsDrawer.displayName = "ThemeSettingsDrawer";