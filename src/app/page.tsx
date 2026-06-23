"use client";

import React from "react";
import { useServers } from "@/contexts/servers-context";
import { ServerDashboardStats } from "@/components/server-dashboard-stats";
import { ClientNavbar } from "@/components/client-navbar";
import { ServerFooter } from "@/components/server-footer";
import { ClientServerSection } from "@/components/client-server-section";
import { useThemeSettings } from "@/contexts/theme-settings-context";
import { DashboardErrorBoundary } from "@/components/dashboard/error-boundary";

function LoadingPlaceholder() {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="stats-container space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-20 skeleton rounded-full" />
          <div className="h-5 w-24 skeleton rounded-sm" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card shadow-sm p-3 sm:p-4">
              <div className="flex items-center">
                <div className="mr-2.5 sm:mr-3 h-8 w-8 sm:h-10 sm:w-10 rounded-xl skeleton" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-14 skeleton rounded-full" />
                  <div className="h-5 w-20 skeleton rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:min-h-[36px]">
          <div className="h-5 w-20 skeleton rounded-full flex-shrink-0" />
          <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-auto">
            <div className="h-8 w-32 sm:w-40 skeleton rounded-full" />
            <div className="h-8 w-8 skeleton rounded-full" />
          </div>
        </div>

        <div className="grid gap-3 server-grid server-grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card shadow-sm h-[300px]">
              <div className="p-4 space-y-3 h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 skeleton rounded-full" />
                    <div className="h-4 w-24 skeleton rounded-full" />
                  </div>
                  <div className="h-4 w-8 skeleton rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 skeleton rounded-full" />
                  <div className="flex gap-1">
                    <div className="h-4 w-10 skeleton rounded-full" />
                    <div className="h-4 w-12 skeleton rounded-full" />
                  </div>
                </div>
                <div className="space-y-2 pt-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-1.5">
                      <div className="flex justify-between">
                        <div className="h-3 w-8 skeleton rounded-full" />
                        <div className="h-3 w-24 skeleton rounded-full" />
                      </div>
                      <div className="h-1 skeleton rounded-full" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-14 skeleton rounded-2xl" />
                  <div className="h-14 skeleton rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data, isLoading } = useServers();
  const { settings, ready } = useThemeSettings();

  if (!ready || (!data && isLoading)) {
    return (
      <div className="flex flex-col min-h-screen">
        <ClientNavbar />
        <main className="flex-1 flex flex-col">
          <LoadingPlaceholder />
        </main>
        <ServerFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ClientNavbar />
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-4 sm:space-y-6 content-container animate-fade-in">
          <DashboardErrorBoundary>
            {settings.showDashboard && <ServerDashboardStats data={data} />}
          </DashboardErrorBoundary>
          <ClientServerSection />
        </div>
      </main>
      <ServerFooter />
    </div>
  );
}