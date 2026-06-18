"use client";

import React from "react";
import { useServers } from "@/contexts/servers-context";
import { ServerDashboardStats } from "@/components/server-dashboard-stats";
import { ClientNavbar } from "@/components/client-navbar";
import { ServerFooter } from "@/components/server-footer";
import { ClientServerSection } from "@/components/client-server-section";
import { ThemeSettingsDrawer } from "@/components/theme-settings-drawer";
import { useThemeSettings } from "@/contexts/theme-settings-context";

export default function Home() {
  const { data } = useServers();
  const { settings } = useThemeSettings();

  return (
    <div className="flex flex-col min-h-screen">
      <ClientNavbar />
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 space-y-6 content-container animate-fade-in">
          {settings.showDashboard && <ServerDashboardStats data={data} />}
          <ClientServerSection />
        </div>
      </main>
      <ServerFooter />
      <ThemeSettingsDrawer />
    </div>
  );
}
