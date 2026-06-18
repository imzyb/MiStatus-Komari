"use client";

import React from "react";
import { useServers } from "@/contexts/servers-context";
import { useSiteInfo } from "@/contexts/site-info-context";
import { ServerDashboardStats } from "@/components/server-dashboard-stats";
import { ClientNavbar } from "@/components/client-navbar";
import { ServerFooter } from "@/components/server-footer";
import { ClientServerSection } from "@/components/client-server-section";
import { config } from "@/lib/config";

export default function Home() {
  const { data } = useServers();
  const { siteInfo } = useSiteInfo();
  const showDashboard = siteInfo?.show_dashboard ?? config.showDashboard;

  return (
    <div className="flex flex-col min-h-screen">
      <ClientNavbar />
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 space-y-6 content-container animate-fade-in">
          {showDashboard && <ServerDashboardStats data={data} />}
          <ClientServerSection />
        </div>
      </main>
      <ServerFooter />
    </div>
  );
}
