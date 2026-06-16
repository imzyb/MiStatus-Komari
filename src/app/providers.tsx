"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { SiteInfoProvider, type SiteInfo } from "@/contexts/site-info-context";
import { RpcConfigProvider } from "@/contexts/rpc-config-context";
import { ServersProvider } from "@/contexts/servers-context";

export function Providers({
  children,
  initialSiteInfo,
}: {
  children: React.ReactNode;
  initialSiteInfo?: SiteInfo | null;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={true}
      storageKey="theme"
      forcedTheme={undefined}
      themes={["light", "dark", "system"]}
      value={{
        light: "light",
        dark: "dark",
        system: "system",
      }}
    >
      <RpcConfigProvider>
        <SiteInfoProvider initialData={initialSiteInfo}>
          <ServersProvider>{children}</ServersProvider>
        </SiteInfoProvider>
      </RpcConfigProvider>
    </ThemeProvider>
  );
}
