"use client";

import { MapPin } from 'lucide-react';
import { useState, Suspense, lazy } from "react";
import { useRegionData } from "@/hooks/use-region-data";
import { ServerListSkeleton } from "./server-list-skeleton";
import { ViewToggle } from "./view-toggle";
import type { ViewMode } from "./view-toggle";

const ServerList = lazy(() =>
  import("@/components/server-list").then((module) => ({
    default: module.ServerList,
  }))
);
const RegionSelect = lazy(() =>
  import("@/components/region-filter").then((module) => ({
    default: module.RegionSelect,
  }))
);
const RegionGroupView = lazy(() =>
  import("@/components/region-group-view").then((module) => ({
    default: module.RegionGroupView,
  }))
);

export const ClientServerSection: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const { regions, regionGroups, isLoading } = useRegionData(selectedRegion);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  return (
      <div className="space-y-6 min-h-[300px] md:min-h-[600px]">
        <div className="flex items-center gap-4 min-h-[40px]">
          <h2
            className="text-xl font-bold tracking-tight"
            suppressHydrationWarning
          >
            服务器列表
          </h2>

          <div className="min-w-[140px]">
            {!isLoading && regions.length > 0 && (
              <Suspense
                fallback={
                  <div className="h-9 w-[140px] bg-muted rounded-md animate-pulse"></div>
                }
              >
                <RegionSelect
                  regions={regions}
                  selectedRegion={selectedRegion}
                  onRegionChange={setSelectedRegion}
                />
              </Suspense>
            )}
            {!isLoading && regions.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-md min-w-[140px] justify-between text-sm text-muted-foreground opacity-50">
                <MapPin className="h-4 w-4" />
                <span>无地区</span>
              </div>
            )}
          </div>

          <div className="ml-auto">
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {!isLoading && (
          <div className="animate-fade-in server-grid-container">
            <Suspense fallback={<ServerListSkeleton />}>
              {selectedRegion ? (
                <RegionGroupView
                  regionGroups={regionGroups}
                  showRegionHeaders={false}
                  viewMode={viewMode}
                />
              ) : (
                <ServerList viewMode={viewMode} />
              )}
            </Suspense>
          </div>
        )}

        {isLoading && <ServerListSkeleton />}
      </div>
  );
};