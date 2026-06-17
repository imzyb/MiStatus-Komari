"use client";

import { MapPin } from 'lucide-react';
import { useState, Suspense, lazy, useEffect, useMemo } from "react";
import { useRegionData } from "@/hooks/use-region-data";
import type { Server } from "@/lib/api";
import { ServerListSkeleton } from "./server-list-skeleton";
import { ViewToggle, type ViewMode } from "./view-toggle";
import { ServerSearch } from "./server-search";

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

const STORAGE_KEY = "mistatus_view_mode";

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "card";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "list" ? "list" : "card";
}

function filterServers(servers: Server[], query: string): Server[] {
  if (!query.trim()) return servers;
  const q = query.toLowerCase();
  return servers.filter(
    (s) =>
      (s.alias || s.name).toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.location || "").toLowerCase().includes(q)
  );
}

export const ClientServerSection: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  const { regions, regionGroups, isLoading } = useRegionData(selectedRegion);

  useEffect(() => {
    setViewMode(getStoredViewMode());
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return (
      <div className="space-y-6 min-h-[300px] md:min-h-[600px]">
        <ServerListSkeleton />
      </div>
    );
  }

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

          <ServerSearch value={searchQuery} onChange={setSearchQuery} />

          <div className="ml-auto">
            <ViewToggle value={viewMode} onChange={handleViewModeChange} />
          </div>
        </div>

        {!isLoading && (
          <div className="animate-fade-in server-grid-container">
            <Suspense fallback={<ServerListSkeleton viewMode={viewMode} />}>
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
            </Suspense>
          </div>
        )}

        {isLoading && <ServerListSkeleton />}
      </div>
  );
};