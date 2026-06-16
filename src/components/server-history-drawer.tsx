"use client";

import React from "react";
import { createPortal } from "react-dom";
import type { Server } from "@/lib/api";
import { useServerHistoryPanel } from "@/contexts/server-history-panel-context";

const ServerLoadChart = React.lazy(() =>
  import("./server-load-chart").then((module) => ({
    default: module.ServerLoadChart,
  }))
);

const EXIT_ANIMATION_MS = 280;
const MIN_PANEL_HEIGHT = 320;
const MAX_PANEL_HEIGHT = 600;
const PANEL_RATIO = 0.5;
const BOTTOM_OFFSET = "calc(env(safe-area-inset-bottom, 0px) + 16px)";
const SIDE_PADDING = "clamp(12px, 5vw, 36px)";

const computePanelHeight = (viewportHeight: number): number => {
  const target = viewportHeight * PANEL_RATIO;
  return Math.max(MIN_PANEL_HEIGHT, Math.min(MAX_PANEL_HEIGHT, target));
};

export const ServerHistoryDrawer: React.FC = () => {
  const { activeServer, isOpen, closePanel } = useServerHistoryPanel();
  const [renderedServer, setRenderedServer] = React.useState<Server | null>(
    activeServer
  );
  const [isMounted, setIsMounted] = React.useState(false);
  const [panelHeight, setPanelHeight] =
    React.useState<number>(MIN_PANEL_HEIGHT);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isMounted) return;

    if (isOpen && activeServer) {
      setRenderedServer(activeServer);
      return;
    }

    if (!isOpen) {
      const timeoutId = window.setTimeout(() => {
        setRenderedServer(null);
      }, EXIT_ANIMATION_MS);
      return () => window.clearTimeout(timeoutId);
    }
  }, [isOpen, activeServer, isMounted]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closePanel]);

  React.useEffect(() => {
    if (!isMounted) return;

    const updateHeight = () => {
      const viewportHeight = window.innerHeight || 0;
      if (viewportHeight <= 0) return;
      setPanelHeight(computePanelHeight(viewportHeight));
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [isMounted]);

  React.useEffect(() => {
    if (!isMounted) return;

    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    if (!renderedServer) return;

    const raf = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isOpen, renderedServer, isMounted]);

  if (!isMounted || !renderedServer) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
      style={{
        bottom: BOTTOM_OFFSET,
        paddingLeft: SIDE_PADDING,
        paddingRight: SIDE_PADDING,
      }}
      aria-hidden={!isOpen && !isVisible}
    >
      <div
        className="pointer-events-auto w-full"
        role="dialog"
        aria-modal="true"
        aria-label="历史指标"
        style={{
          transform: isVisible
            ? "translateY(0)"
            : "translateY(calc(100% + 24px))",
          opacity: isVisible ? 1 : 0,
          transition:
            "transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease",
          transformOrigin: "bottom center",
        }}
      >
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
          <div
            className="flex flex-col"
            style={{
              height: `${panelHeight}px`,
              minHeight: `${MIN_PANEL_HEIGHT}px`,
              maxHeight: `${MAX_PANEL_HEIGHT}px`,
            }}
          >
            <div className="relative flex-1 overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
              <React.Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                    正在加载历史图表...
                  </div>
                }
              >
                <ServerLoadChart
                  serverId={renderedServer.gid || ""}
                  active={isOpen}
                  className="flex h-full flex-col"
                  showTypeSelector={true}
                  defaultLoadType="cpu"
                  variant="expanded"
                  footerLabel={renderedServer.alias || renderedServer.name}
                />
              </React.Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
