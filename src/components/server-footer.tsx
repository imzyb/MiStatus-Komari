import React from "react";

export const ServerFooter: React.FC = () => {
  return (
    <footer className="py-8 border-t border-border bg-background flex items-center justify-center">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">
          Powered by Komari · MiStatus
        </p>
      </div>
    </footer>
  );
};
