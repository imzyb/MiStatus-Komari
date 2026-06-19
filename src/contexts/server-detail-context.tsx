'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Server } from '@/lib/api';

interface ServerDetailContextValue {
  selectedServer: Server | null;
  openDetail: (server: Server) => void;
  closeDetail: () => void;
}

const ServerDetailContext = createContext<ServerDetailContextValue | null>(null);

export function ServerDetailProvider({ children, showDetails = true }: { children: React.ReactNode; showDetails?: boolean }) {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  const openDetail = useCallback((server: Server) => {
    if (!showDetails) return;
    setSelectedServer(server);
  }, [showDetails]);

  const closeDetail = useCallback(() => {
    setSelectedServer(null);
  }, []);

  return (
    <ServerDetailContext.Provider value={{ selectedServer, openDetail, closeDetail }}>
      {children}
    </ServerDetailContext.Provider>
  );
}

export function useServerDetail(): ServerDetailContextValue {
  const ctx = useContext(ServerDetailContext);
  if (!ctx) throw new Error('useServerDetail must be used within ServerDetailProvider');
  return ctx;
}