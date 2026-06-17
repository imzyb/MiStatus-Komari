"use client";

import React from "react";
import { Search } from "lucide-react";

interface ServerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const ServerSearch: React.FC<ServerSearchProps> = React.memo(
  function ServerSearch({ value, onChange }) {
    return (
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="搜索服务器..."
          className="h-9 w-40 sm:w-56 rounded-md border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
        />
      </div>
    );
  }
);
ServerSearch.displayName = "ServerSearch";