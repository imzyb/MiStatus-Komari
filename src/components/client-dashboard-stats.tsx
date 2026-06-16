"use client";

import React from "react";
import { useServers } from "@/contexts/servers-context";
import { ServerDashboardStats } from "./server-dashboard-stats";

export const ClientDashboardStats: React.FC = () => {
  const { data } = useServers();

  return <ServerDashboardStats data={data} />;
};
