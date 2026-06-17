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
      <div className="flex items-center rounded-md border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => onChange("card")}
          className={`inline-flex items-center justify-center h-8 w-8 transition-colors ${
            value === "card"
              ? "bg-accent text-primary-foreground"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          }`}
          aria-label="卡片视图"
          title="卡片视图"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange("list")}
          className={`inline-flex items-center justify-center h-8 w-8 transition-colors ${
            value === "list"
              ? "bg-accent text-primary-foreground"
              : "bg-transparent text-muted-foreground hover:text-foreground"
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