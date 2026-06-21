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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Activity className="h-7 w-7 text-primary/40" />
            </div>
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground/80">正在载入</h2>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data } = useServers();
  const { settings, ready } = useThemeSettings();

  if (!ready) {
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