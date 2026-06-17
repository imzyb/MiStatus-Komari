"use client";

import React, { useEffect } from "react";
import { X, MapPin, Clock, Server as ServerIcon } from "lucide-react";
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

    const uptime = (() => {
      if (!selectedServer.uptime) return "—";
      const m = selectedServer.uptime.match(/^(\d+)s$/);
      if (!m) return selectedServer.uptime;
      return formatDurationEnShort(parseInt(m[1], 10), 3);
    })();

    return (
      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
        <div className="fixed inset-0 bg-black/60" onClick={closeDetail} />
        <div className="relative w-full max-w-2xl bg-card border border-border rounded-t-xl sm:rounded-xl shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 bg-card border-b border-hairline px-4 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                selectedServer.online ? "bg-trading-up shadow-[0_0_6px_rgba(14,203,129,0.4)]" : "bg-muted-foreground/40"
              }`} />
              <h2 className="text-base font-semibold truncate">
                {selectedServer.alias || selectedServer.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeDetail}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {selectedServer.type && (
                <span className="flex items-center gap-1">
                  <ServerIcon className="h-3.5 w-3.5" />
                  {selectedServer.type}
                </span>
              )}
              {selectedServer.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedServer.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {uptime}
              </span>
            </div>

            <div className="border-t border-hairline pt-4">
              <h3 className="text-sm font-semibold mb-3">延迟监测历史</h3>
              <PingChart serverId={selectedServer.gid} />
            </div>

            {!selectedServer.online && (
              <div className="text-xs text-muted-foreground text-center py-2">
                服务器当前离线，仅显示历史数据
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ServerDetailDrawer.displayName = "ServerDetailDrawer";