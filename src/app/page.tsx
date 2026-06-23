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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 animate-fade-in">
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="rounded-3xl bg-card shadow-sm border border-hairline/40 px-16 py-12 flex flex-col items-center gap-6">
          <div className="h-20 w-20 rounded-[2rem] bg-primary/5 flex items-center justify-center ring-1 ring-primary/10">
            <Activity className="h-9 w-9 text-primary/30" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-base font-medium text-foreground/60 tracking-wide">正在载入</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
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