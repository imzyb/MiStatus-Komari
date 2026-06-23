import React from "react";
import { useThemeSettings } from "@/contexts/theme-settings-context";

export const ServerFooter: React.FC = () => {
  const { settings } = useThemeSettings();

  if (!settings.showFooter) return null;

  return (
    <footer className="mt-auto border-t border-hairline/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center gap-2">
        {settings.footerContent ? (
          <p className="text-[11px] text-muted-foreground/70 tracking-wide text-center" dangerouslySetInnerHTML={{ __html: settings.footerContent }} />
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-primary/40" />
            <p className="text-[11px] text-muted-foreground/70 tracking-wide">
              Powered by MiStatus
            </p>
            <div className="h-1 w-1 rounded-full bg-primary/40" />
          </div>
        )}
      </div>
    </footer>
  );
};
