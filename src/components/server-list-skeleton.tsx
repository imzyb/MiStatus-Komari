"use client";

import React from "react";

export const ServerListSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 server-grid">
      {Array(8)
        .fill(null)
        .map((_, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card text-card-foreground h-[300px]"
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
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-8 skeleton rounded" />
                    <div className="h-3 w-32 skeleton rounded" />
                  </div>
                  <div className="h-1 skeleton rounded" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-8 skeleton rounded" />
                    <div className="h-3 w-32 skeleton rounded" />
                  </div>
                  <div className="h-1 skeleton rounded" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-8 skeleton rounded" />
                    <div className="h-3 w-32 skeleton rounded" />
                  </div>
                  <div className="h-1 skeleton rounded" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-8 skeleton rounded" />
                    <div className="h-3 w-32 skeleton rounded" />
                  </div>
                  <div className="h-1 skeleton rounded" />
                </div>
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
