"use client";

import React, { useEffect } from "react";
import { X, MapPin, Clock } from "lucide-react";
import { useServerDetail } from "@/contexts/server-detail-context";
import { PingChart } from "./ping-chart";
import { formatDurationEnShort } from "@/lib/utils";

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

    return (
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDetail} />
        <div className="relative w-full max-w-2xl bg-white dark:bg-[#2c2c2c] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up max-h-[95vh] sm:max-h-[92vh] overflow-y-auto mx-0 sm:mx-0">
          <div className="sticky top-0 bg-white/90 dark:bg-[#2c2c2c]/90 backdrop-blur-xl border-b border-hairline/50 px-4 sm:px-5 py-2.5 flex items-center justify-between z-10 rounded-t-3xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                s.online ? "bg-trading-up shadow-[0_0_4px_rgba(0,181,120,0.3)]" : "bg-muted-foreground/30"
              }`} />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold truncate">{s.alias || s.name}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
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

          <div className="p-4 sm:p-5">
            <PingChart serverId={s.gid} />

            {!s.online && (
              <div className="text-[11px] text-muted-foreground/60 text-center py-1.5 rounded-full bg-muted/30 mt-4">
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