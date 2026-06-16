import React from "react";

export const ServerFooter: React.FC = () => {
  return (
    <footer className="py-6 border-t min-h-[88px] flex items-center justify-center">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Powered by Komari
        </p>
      </div>
    </footer>
  );
};
