"use client";

import React from "react";

export const ServerListSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 server-grid">
      {Array(8)
        .fill(null)
        .map((_, index) => (
          <div
            key={index}
            className="h-[300px] rounded-lg overflow-hidden"
          >
            <div className="h-full skeleton rounded-lg" />
          </div>
        ))}
    </div>
  );
};

ServerListSkeleton.displayName = "ServerListSkeleton";
