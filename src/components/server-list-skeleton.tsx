"use client";

import React from "react";
import type { ViewMode } from "./view-toggle";

interface ServerListSkeletonProps {
  viewMode?: ViewMode;
}

const SkeletonRow: React.FC<{ index: number }> = ({ index }) => (
  <div key={index} className="flex items-center gap-2 px-4 py-3 border-b border-hairline">
    <div className="flex items-center gap-2 flex-[3] sm:flex-[2]">
      <div className="h-2 w-2 skeleton rounded-full flex-shrink-0" />
      <div className="h-4 w-28 skeleton rounded flex-shrink-0" />
    </div>
    <div className="flex items-center gap-2 flex-1">
      <div className="h-1 w-12 sm:w-16 skeleton rounded-full" />
      <div className="h-4 w-6 skeleton rounded hidden sm:block" />
    </div>
    <div className="hidden md:flex items-center gap-2 flex-1">
      <div className="h-1 w-16 skeleton rounded-full" />
    </div>
    <div className="hidden lg:flex items-center gap-2 flex-1">
      <div className="h-1 w-16 skeleton rounded-full" />
    </div>
    <div className="hidden xl:block flex-1">
      <div className="h-4 w-14 skeleton rounded" />
    </div>
    <div className="flex items-center gap-3 flex-shrink-0">
      <div className="h-4 w-16 skeleton rounded hidden sm:block" />
      <div className="h-4 w-8 skeleton rounded" />
    </div>
  </div>
);

export const ServerListSkeleton: React.FC<ServerListSkeletonProps> = ({
  viewMode = "card",
}) => {
  if (viewMode === "list") {
    return (
      <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-hairline">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className="flex-1">
              <div className="h-3 w-12 skeleton rounded" />
            </div>
          ))}
        </div>
        {Array(5).fill(null).map((_, i) => (
          <SkeletonRow key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 server-grid">
      {Array(8)
        .fill(null)
        .map((_, index) => (
          <div
            key={index}
            className="rounded-2xl bg-card shadow-sm text-card-foreground h-[300px]"
          >
            <div className="p-4 space-y-3 h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 skeleton rounded-full" />
                  <div className="h-5 w-28 skeleton rounded" />
                </div>
                <div className="h-4 w-8 skeleton rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 skeleton rounded" />
                <div className="h-3 w-24 skeleton rounded" />
              </div>
              <div className="space-y-2 pt-4">
                {Array(4).fill(null).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-8 skeleton rounded" />
                      <div className="h-3 w-32 skeleton rounded" />
                    </div>
                    <div className="h-1 skeleton rounded" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="h-16 skeleton rounded" />
                <div className="h-16 skeleton rounded" />
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

ServerListSkeleton.displayName = "ServerListSkeleton";