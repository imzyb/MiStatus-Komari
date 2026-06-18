"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { SiteInfoProvider, type SiteInfo } from "@/contexts/site-info-context";
import { RpcConfigProvider } from "@/contexts/rpc-config-context";
import { ServersProvider } from "@/contexts/servers-context";
import { ThemeSettingsProvider } from "@/contexts/theme-settings-context";

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
          <ServersProvider>
            <ThemeSettingsProvider>{children}</ThemeSettingsProvider>
          </ServersProvider>
        </SiteInfoProvider>
      </RpcConfigProvider>
    </ThemeProvider>
  );
}
