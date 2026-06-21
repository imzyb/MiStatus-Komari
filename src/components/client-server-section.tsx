"use client";

import { MapPin } from 'lucide-react';
import { useState, Suspense, lazy, useEffect, useMemo, useRef } from "react";
import { useRegionData } from "@/hooks/use-region-data";
import { ServerListSkeleton } from "./server-list-skeleton";
import { ViewToggle, type ViewMode } from "./view-toggle";
import { ServerSearch } from "./server-search";
import { ServerList } from "./server-list";
import { RegionGroupView } from "./region-group-view";
import { filterServers } from "@/lib/utils/filter";
import { ServerDetailProvider } from "@/contexts/server-detail-context";
import { ServerDetailDrawer } from "./server-detail-drawer";
import { useThemeSettings } from "@/contexts/theme-settings-context";

const RegionSelect = lazy(() =>
  import("@/components/region-filter").then((module) => ({
    default: module.RegionSelect,
  }))
);

const STORAGE_KEY = "mistatus_view_mode";

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "card";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "list" ? "list" : "card";
}

export const ClientServerSection: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [searchQuery, setSearchQuery] = useState("");
  const { settings } = useThemeSettings();

  const { regions, regionGroups, isLoading } = useRegionData(selectedRegion);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of regionGroups) {
      counts[g.region] = g.servers.length;
    }
    return counts;
  }, [regionGroups]);

  useEffect(() => {
    setViewMode(getStoredViewMode());
  }, []);

  useEffect(() => {
    if (!isLoading && gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedRegion, isLoading]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  };

  const filteredRegionGroups = useMemo(() => {
    if (!searchQuery.trim()) return regionGroups;
    return regionGroups
      .map((g) => ({
        ...g,
        servers: filterServers(g.servers, searchQuery),
      }))
      .filter((g) => g.servers.length > 0);
  }, [regionGroups, searchQuery]);

  return (
    <ServerDetailProvider showDetails={settings.showDetails}>
      <div className={`space-y-4 min-h-[300px] md:min-h-[600px] ${!isLoading ? 'animate-fade-in' : ''}`}>
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3 sm:min-h-[36px]">
          <h2
            className="text-xl font-bold tracking-tight flex-shrink-0"
            suppressHydrationWarning
          >
            服务器列表
          </h2>

          <div className="flex items-center gap-2 sm:ml-auto">
            <div className="flex-1 sm:flex-none sm:min-w-[120px]">
              {!isLoading && regions.length > 0 && (
                <Suspense
                  fallback={
                    <div className="h-9 w-full bg-muted rounded-full animate-pulse"></div>
                  }
                >
                  <RegionSelect
                    regions={regions}
                    selectedRegion={selectedRegion}
                    onRegionChange={setSelectedRegion}
                    regionCounts={regionCounts}
                  />
                </Suspense>
              )}
              {!isLoading && regions.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 text-xs text-muted-foreground opacity-50">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>无地区</span>
                </div>
              )}
            </div>

            <div className="flex-1 sm:flex-none">
              <ServerSearch value={searchQuery} onChange={setSearchQuery} />
            </div>

            <ViewToggle value={viewMode} onChange={handleViewModeChange} />
          </div>
        </div>

        {isLoading ? (
          <ServerListSkeleton viewMode={viewMode} />
        ) : (
          <div ref={gridRef} className="server-grid-container">
            {selectedRegion ? (
              <RegionGroupView
                regionGroups={filteredRegionGroups}
                showRegionHeaders={false}
                viewMode={viewMode}
              />
            ) : (
              <ServerList
                viewMode={viewMode}
                searchQuery={searchQuery}
              />
            )}
          </div>
        )}
      </div>
      <ServerDetailDrawer />
    </ServerDetailProvider>
  );
};