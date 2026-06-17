"use client";

import React, { useEffect, useRef } from "react";
import { Search } from "lucide-react";

interface ServerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const ServerSearch: React.FC<ServerSearchProps> = React.memo(
  function ServerSearch({ value, onChange }) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "/" && !e.ctrlKey && !e.metaKey && document.activeElement !== inputRef.current) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="搜索服务器..."
          className="h-9 w-40 sm:w-56 rounded-full bg-muted/60 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white dark:focus:bg-[#2c2c2c] transition-colors"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center justify-center h-4 px-1 rounded border border-border text-[10px] text-muted-foreground font-mono pointer-events-none">
          /
        </kbd>
      </div>
    );
  }
);
ServerSearch.displayName = "ServerSearch";