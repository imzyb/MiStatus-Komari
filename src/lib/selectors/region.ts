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

let lastServersSignature: string | null = null;
let lastBaseResult: BaseRegionComputed | null = null;

// 生成稳定签名：按 gid 排序，仅取影响地区分组与排序的关键字段
const buildServersSignature = (servers: Server[]): string => {
  // 只取 gid、location、latest_ts 三项，避免将会频繁波动但不影响分区结果的字段写入签名
  const simplified = servers
    .map((s) => ({
      gid: s.gid,
      location: s.location || "未知地区",
      ts: s.latest_ts ?? 0,
    }))
    .sort((a, b) => a.gid.localeCompare(b.gid, "zh-CN"));
  return JSON.stringify(simplified);
};

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

export const getRegionBaseMemoized = (
  servers: Server[] | undefined | null
): BaseRegionComputed => {
  if (!servers || servers.length === 0) {
    return { regions: [], allRegionGroups: [] };
  }
  const signature = buildServersSignature(servers);
  if (lastServersSignature === signature && lastBaseResult) {
    return lastBaseResult;
  }
  const computed = computeBaseOnce(servers);
  lastServersSignature = signature;
  lastBaseResult = computed;
  return computed;
};

let lastSelectedRegion: string | null | undefined = undefined;
let lastSelectionInput: BaseRegionComputed | null = null;
let lastSelectionResult: RegionSelectionResult | null = null;

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

  const base = getRegionBaseMemoized(servers);

  if (
    lastSelectionInput === base &&
    lastSelectedRegion === selectedRegion &&
    lastSelectionResult
  ) {
    return lastSelectionResult;
  }

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

  const result: RegionSelectionResult = {
    regions: base.regions,
    allRegionGroups: base.allRegionGroups,
    regionGroups,
    filteredServers,
    stats: {
      totalRegions: base.regions.length,
      serversInSelectedRegion: filteredServers.length,
    },
  };

  lastSelectionInput = base;
  lastSelectedRegion = selectedRegion;
  lastSelectionResult = result;
  return result;
};

export type { RegionSelectionResult };
