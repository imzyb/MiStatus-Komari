"use client";

import React, { useEffect } from "react";
import { X, MapPin, Clock } from "lucide-react";
import { useServerDetail } from "@/contexts/server-detail-context";
import { PingChart } from "./ping-chart";
import { formatPercent, formatBytes, formatUptime, getThresholdColor } from "@/lib/utils";

function MiniBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-1 w-8 sm:w-14 rounded-full bg-muted overflow-hidden flex-shrink-0">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

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
    const uptime = formatUptime(s.uptime, 3);

    const cpuP = formatPercent(s.cpu, 100);
    const memP = formatPercent(s.memory_used, s.memory_total);
    const diskP = formatPercent(s.hdd_used, s.hdd_total);
    const cpuColor = getThresholdColor(cpuP).bar;
    const memColor = getThresholdColor(memP).bar;
    const diskColor = getThresholdColor(diskP).bar;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={closeDetail} />
        <div className="relative w-full max-w-2xl bg-card rounded-3xl shadow-2xl animate-scale-in max-h-[85vh] sm:max-h-[92vh] overflow-y-auto overscroll-contain">
          <div className="sticky top-0 bg-card/90 backdrop-blur-xl border-b border-hairline/50 px-3 sm:px-6 py-2 sm:py-2.5 z-10 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full flex-shrink-0 ${
                  s.online ? "bg-trading-up shadow-[0_0_4px_rgba(0,181,120,0.3)]" : "bg-muted-foreground/30"
                }`} />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold truncate">{s.alias || s.name}</h2>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-muted-foreground">
                    {s.type && <span>{s.type}</span>}
                    {s.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{s.location}</span>}
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{uptime}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0 -mr-1 -mt-1"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {s.online && (
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-hairline/50">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground w-6 sm:w-7">CPU</span>
                  <MiniBar percent={cpuP} color={cpuColor} />
                  <span className="text-[9px] sm:text-[10px] font-mono text-foreground/70 w-7 sm:w-8 text-right">{cpuP}%</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground w-6 sm:w-7">内存</span>
                  <MiniBar percent={memP} color={memColor} />
                  <span className="text-[9px] sm:text-[10px] font-mono text-foreground/70 w-7 sm:w-8 text-right">{memP}%</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground w-6 sm:w-7">硬盘</span>
                  <MiniBar percent={diskP} color={diskColor} />
                  <span className="text-[9px] sm:text-[10px] font-mono text-foreground/70 w-7 sm:w-8 text-right">{diskP}%</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">流量</span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-foreground/70">↓{formatBytes(s.network_in)}</span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-foreground/70">↑{formatBytes(s.network_out)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-5">
            <PingChart
                serverId={s.gid}
                livePingMap={{ 1: s.ping_10010, 2: s.ping_189, 3: s.ping_10086 }}
              />

            {!s.online && (
              <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 rounded-xl bg-muted/40">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                <span className="text-xs text-muted-foreground">服务器离线，仅显示历史数据</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ServerDetailDrawer.displayName = "ServerDetailDrawer";