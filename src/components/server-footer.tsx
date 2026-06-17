import React from "react";

export const ServerFooter: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-hairline/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-primary/40" />
          <p className="text-[11px] text-muted-foreground/70 tracking-wide">
            Powered by Komari · MiStatus
          </p>
          <div className="h-1 w-1 rounded-full bg-primary/40" />
        </div>
      </div>
    </footer>
  );
};