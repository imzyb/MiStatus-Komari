"use client";

import React from "react";
import type { Server } from "@/lib/api";

type ServerHistoryPanelContextValue = {
  activeServer: Server | null;
  isOpen: boolean;
  toggleServerHistory: (server: Server) => void;
  closePanel: () => void;
};

const ServerHistoryPanelContext =
  React.createContext<ServerHistoryPanelContextValue | null>(null);

export const ServerHistoryPanelProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [activeServer, setActiveServer] = React.useState<Server | null>(null);

  const toggleServerHistory = React.useCallback((server: Server) => {
    if (!server.gid) {
      return;
    }

    setActiveServer((previous) => {
      if (previous && previous.gid === server.gid) {
        return null;
      }
      return server;
    });
  }, []);

  const closePanel = React.useCallback(() => {
    setActiveServer(null);
  }, []);

  const value = React.useMemo(
    () => ({
      activeServer,
      isOpen: Boolean(activeServer?.gid),
      toggleServerHistory,
      closePanel,
    }),
    [activeServer, toggleServerHistory, closePanel]
  );

  return (
    <ServerHistoryPanelContext.Provider value={value}>
      {children}
    </ServerHistoryPanelContext.Provider>
  );
};

export const useServerHistoryPanel = (): ServerHistoryPanelContextValue => {
  const context = React.useContext(ServerHistoryPanelContext);
  if (!context) {
    throw new Error(
      "useServerHistoryPanel must be used within ServerHistoryPanelProvider"
    );
  }
  return context;
};
