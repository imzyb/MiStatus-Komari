"use client";

import { useState, Suspense, lazy } from "react";
import { useRegionData } from "@/hooks/use-region-data";
import { ServerHistoryPanelProvider } from "@/contexts/server-history-panel-context";
import { ServerHistoryDrawer } from "@/components/server-history-drawer";
import { ServerListSkeleton } from "./server-list-skeleton";

// 懒加载大的组件
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

  return (
    <ServerHistoryPanelProvider>
      <div className="space-y-6 min-h-[300px] md:min-h-[600px]">
        <div className="flex items-center gap-4 min-h-[40px]">
          <h2
            className="text-2xl font-bold tracking-tight"
            suppressHydrationWarning
          >
            服务器列表
          </h2>

          {/* 地区选择下拉菜单 - 懒加载 */}
          <div className="min-w-[140px]">
            {!isLoading && regions.length > 0 && (
              <Suspense
                fallback={
                  <div className="h-9 w-[140px] bg-muted/20 rounded-md animate-pulse"></div>
                }
              >
                <RegionSelect
                  regions={regions}
                  selectedRegion={selectedRegion}
                  onRegionChange={setSelectedRegion}
                />
              </Suspense>
            )}
          </div>
        </div>

        {/* 服务器列表 - 懒加载 */}
        {!isLoading && (
          <div className="animate-fade-in server-grid-container">
            <Suspense fallback={<ServerListSkeleton />}>
              {selectedRegion ? (
                // 选择了特定地区时，只显示该地区的服务器，不显示地区标题
                <RegionGroupView
                  regionGroups={regionGroups}
                  showRegionHeaders={false}
                />
              ) : (
                // 默认状态：显示所有服务器，使用原有ServerList组件
                <ServerList />
              )}
            </Suspense>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && <ServerListSkeleton />}
      </div>
      <ServerHistoryDrawer />
    </ServerHistoryPanelProvider>
  );
};
