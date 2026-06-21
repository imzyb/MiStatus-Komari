"use client";

import React from "react";
import { useServers } from "@/contexts/servers-context";
import { ServerDashboardStats } from "@/components/server-dashboard-stats";
import { ClientNavbar } from "@/components/client-navbar";
import { ServerFooter } from "@/components/server-footer";
import { ClientServerSection } from "@/components/client-server-section";
import { useThemeSettings } from "@/contexts/theme-settings-context";
import { DashboardErrorBoundary } from "@/components/dashboard/error-boundary";
import { Activity } from "lucide-react";

function LoadingPlaceholder() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl bg-card shadow-sm px-10 py-8 flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 text-muted-foreground/40" />
          <span className="text-sm text-muted-foreground">正在载入...</span>
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
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 space-y-6 content-container animate-fade-in">
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