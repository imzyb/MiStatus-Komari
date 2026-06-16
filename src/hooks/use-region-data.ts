"use client";

import { useMemo } from "react";
import { useServers } from "@/contexts/servers-context";
import { Server } from "@/lib/api";
import { selectRegionData } from "@/lib/selectors/region";

export const useRegionData = (selectedRegion?: string | null) => {
  const { data, isLoading, error } = useServers();

  const regionData = useMemo(() => {
    return selectRegionData(
      data?.servers as Server[] | undefined,
      selectedRegion
    );
  }, [data?.servers, selectedRegion]);

  return {
    ...regionData,
    isLoading,
    error,
  };
};
