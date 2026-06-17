"use client";

import React, { useEffect } from "react";
import { X, MapPin, Clock, Cpu, HardDrive, MemoryStick, Activity } from "lucide-react";
import { useServerDetail } from "@/contexts/server-detail-context";
import { PingChart } from "./ping-chart";
import { formatDurationEnShort, formatBytes, formatPercent } from "@/lib/utils";

export const ServerDetailDrawer: React.FC = React.memo(
  function ServerDetailDrawer() {
    const { selectedServer, closeDetail } = useServerDetail();

    useEffect(() => {
      if (!selectedServer) return;
      const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeDetail(); };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [selectedServer, closeDetail]);

    if (!selectedServer) return null;

    const s = selectedServer;
    const uptime = (() => {
      if (!s.uptime) return "—";
      const m = s.uptime.match(/^(\d+)s$/);
      if (!m) return s.uptime;
      return formatDurationEnShort(parseInt(m[1], 10), 3);
    })();

    const cpuP = formatPercent(s.cpu, 100);
    const memP = formatPercent(s.memory_used, s.memory_total);
    const diskP = formatPercent(s.hdd_used, s.hdd_total);

    return (
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDetail} />
        <div className="relative w-full max-w-3xl bg-white dark:bg-[#2c2c2c] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up max-h-[92vh] sm:max-h-[88vh] overflow-y-auto mx-0 sm:mx-0">
          <div className="sticky top-0 bg-white/90 dark:bg-[#2c2c2c]/90 backdrop-blur-xl border-b border-hairline/50 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between z-10 rounded-t-3xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                s.online ? "bg-trading-up shadow-[0_0_4px_rgba(0,181,120,0.3)]" : "bg-muted-foreground/30"
              }`} />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold truncate">{s.alias || s.name}</h2>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {s.type && <span>{s.type}</span>}
                  {s.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{s.location}</span>}
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{uptime}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={closeDetail}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="rounded-2xl bg-card border border-hairline/70 p-2.5 sm:p-3 space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Cpu className="h-3 w-3" /> CPU
                </div>
                <div className="text-base sm:text-lg font-bold font-mono leading-tight">{cpuP}%</div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${cpuP >= 90 ? "bg-trading-down" : "bg-trading-up"}`} style={{ width: `${cpuP}%` }} />
                </div>
              </div>
              <div className="rounded-2xl bg-card border border-hairline/70 p-2.5 sm:p-3 space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <MemoryStick className="h-3 w-3" /> 内存
                </div>
                <div className="text-base sm:text-lg font-bold font-mono leading-tight">{memP}%</div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${memP >= 90 ? "bg-trading-down" : "bg-trading-up"}`} style={{ width: `${memP}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">{formatBytes(s.memory_used)} / {formatBytes(s.memory_total)}</div>
              </div>
              <div className="rounded-2xl bg-card border border-hairline/70 p-2.5 sm:p-3 space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <HardDrive className="h-3 w-3" /> 硬盘
                </div>
                <div className="text-base sm:text-lg font-bold font-mono leading-tight">{diskP}%</div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${diskP >= 90 ? "bg-trading-down" : "bg-trading-up"}`} style={{ width: `${diskP}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">{formatBytes(s.hdd_used)} / {formatBytes(s.hdd_total)}</div>
              </div>
              <div className="rounded-2xl bg-card border border-hairline/70 p-2.5 sm:p-3 space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Activity className="h-3 w-3" /> 网络
                </div>
                <div className="text-xs sm:text-sm font-mono leading-relaxed space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-trading-down">↓</span>
                    <span className="truncate">{formatBytes(s.network_in)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-trading-up">↑</span>
                    <span className="truncate">{formatBytes(s.network_out)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-hairline/50 pt-3 sm:pt-4">
              <h3 className="text-xs font-semibold mb-3 text-foreground/80">延迟监测</h3>
              <PingChart serverId={s.gid} />
            </div>

            {!s.online && (
              <div className="text-[11px] text-muted-foreground/60 text-center py-1.5 rounded-full bg-muted/30">
                服务器离线，仅显示历史数据
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ServerDetailDrawer.displayName = "ServerDetailDrawer";