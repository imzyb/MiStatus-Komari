"use client";

import React from "react";
import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "card" | "list";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = React.memo(
  function ViewToggle({ value, onChange }) {
    return (
      <div className="flex items-center rounded-full bg-muted/60 p-0.5">
        <button
          type="button"
          onClick={() => onChange("card")}
          className={`inline-flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200 ${
            value === "card"
              ? "bg-white dark:bg-[#2c2c2c] shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="卡片视图"
          title="卡片视图"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange("list")}
          className={`inline-flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200 ${
            value === "list"
              ? "bg-white dark:bg-[#2c2c2c] shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="列表视图"
          title="列表视图"
        >
          <List className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }
);
ViewToggle.displayName = "ViewToggle";