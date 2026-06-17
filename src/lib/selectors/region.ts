import type { Server, RegionGroup } from "@/lib/api";

interface BaseRegionComputed {
  regions: string[];
  allRegionGroups: RegionGroup[];
}

interface RegionSelectionResult extends BaseRegionComputed {
  regionGroups: RegionGroup[];
  filteredServers: Server[];
  stats: {
    totalRegions: number;
    serversInSelectedRegion: number;
  };
}

const computeBaseOnce = (servers: Server[]): BaseRegionComputed => {
  const groups = new Map<string, Server[]>();
  const regionSet = new Set<string>();

  for (const server of servers) {
    const region = server.location || "未知地区";
    regionSet.add(region);
    const list = groups.get(region);
    if (list) {
      list.push(server);
    } else {
      groups.set(region, [server]);
    }
  }

  const regions = Array.from(regionSet).sort((a, b) => {
    if (a === "未知地区") return 1;
    if (b === "未知地区") return -1;
    return a.localeCompare(b, "zh-CN");
  });

  const allRegionGroups = Array.from(groups.entries())
    .map(([region, servers]) => ({ region, servers }))
    .sort((a, b) => {
      if (a.region === "未知地区") return 1;
      if (b.region === "未知地区") return -1;
      return a.region.localeCompare(b.region, "zh-CN");
    });

  return { regions, allRegionGroups };
};

export const selectRegionData = (
  servers: Server[] | undefined | null,
  selectedRegion?: string | null
): RegionSelectionResult => {
  if (!servers || servers.length === 0) {
    return {
      regions: [],
      allRegionGroups: [],
      regionGroups: [],
      filteredServers: [],
      stats: { totalRegions: 0, serversInSelectedRegion: 0 },
    };
  }

  const base = computeBaseOnce(servers);
  let filteredServers: Server[];
  let regionGroups: RegionGroup[];

  if (selectedRegion) {
    filteredServers = servers.filter(
      (s) => (s.location || "未知地区") === selectedRegion
    );
    regionGroups = base.allRegionGroups.filter(
      (g) => g.region === selectedRegion
    );
  } else {
    filteredServers = servers;
    regionGroups = base.allRegionGroups;
  }

  return {
    regions: base.regions,
    allRegionGroups: base.allRegionGroups,
    regionGroups,
    filteredServers,
    stats: {
      totalRegions: base.regions.length,
      serversInSelectedRegion: filteredServers.length,
    },
  };
};

export type { RegionSelectionResult };