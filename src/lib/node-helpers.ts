import type { Server } from "./api";
import { normalizeVirtualizationLabel } from "./utils";

export function sortServers(servers: Server[], now: number = Date.now()): Server[] {
  const isOnline = (s: Server): boolean => {
    return Boolean(
      s.online || s.online4 || s.online6 ||
      (s.latest_ts && now - s.latest_ts < 120_000)
    );
  };
  return [...servers].sort((a, b) => {
    const aOnline = isOnline(a);
    const bOnline = isOnline(b);
    if (aOnline !== bOnline) return aOnline ? -1 : 1;
    if (a.weight !== b.weight) return a.weight - b.weight;
    return (a.alias || a.name).localeCompare(b.alias || b.name);
  });
}

/**
 * 节点基础信息类型
 */
export interface NodeBase {
  uuid: string;
  name?: string;
  public_remark?: string;
  region?: string;
  group?: string;
  weight?: number;
  virtualization?: string;
  arch?: string;
  ipv4?: string;
  ipv6?: string;
}

/**
 * WebSocket 实时数据中的节点信息类型
 */
export interface WsNodeRealtime {
  cpu?: { usage?: number };
  ram?: { total?: number; used?: number };
  swap?: { total?: number; used?: number };
  load?: { load1?: number; load5?: number; load15?: number };
  disk?: { total?: number; used?: number };
  network?: {
    up?: number;
    down?: number;
    totalUp?: number;
    totalDown?: number;
  };
  connections?: { tcp?: number; udp?: number };
  uptime?: number;
  process?: number;
  message?: string;
  updated_at?: string;
  ping_10010?: number;
  ping_189?: number;
  ping_10086?: number;
}

/**
 * 将节点基础信息数组转换为映射
 * @param nodesData 节点数据（数组或对象格式）
 * @returns 节点映射
 */
export function createNodesMap(nodesData: unknown): Record<string, NodeBase> {
  const map: Record<string, NodeBase> = {};

  if (Array.isArray(nodesData)) {
    // 如果是数组格式，转换为映射
    for (const node of nodesData) {
      if (node && typeof node.uuid === "string") {
        map[node.uuid] = {
          uuid: node.uuid,
          name: node.name,
          public_remark: node.public_remark,
          region: node.region,
          group: node.group,
          weight: node.weight,
          virtualization: node.virtualization,
          arch: node.arch,
          ipv4: node.ipv4,
          ipv6: node.ipv6,
        };
      }
    }
  } else if (typeof nodesData === "object" && nodesData !== null) {
    // 如果是对象格式，直接使用
    for (const [uuid, node] of Object.entries(nodesData)) {
      if (node && typeof node.uuid === "string") {
        map[uuid] = {
          uuid: node.uuid,
          name: node.name,
          public_remark: node.public_remark,
          region: node.region,
          group: node.group,
          weight: node.weight,
          virtualization: node.virtualization,
          arch: node.arch,
          ipv4: node.ipv4,
          ipv6: node.ipv6,
        };
      }
    }
  }

  return map;
}

/**
 * 将 REST API 响应转换为节点映射
 * @param payload REST API 响应
 * @returns 节点映射
 */
export function createNodesMapFromRest(
  payload: unknown
): Record<string, NodeBase> {
  const list: unknown = (payload as { data?: unknown })?.data;
  const arr = Array.isArray(list) ? (list as NodeBase[]) : [];
  const map: Record<string, NodeBase> = {};

  for (const n of arr) {
    if (n && typeof n.uuid === "string") {
      map[n.uuid] = n;
    }
  }

  return map;
}

/**
 * 将 WebSocket 实时数据和节点基础信息转换为 Server 对象
 * @param uuid 节点 UUID
 * @param realtimeData WebSocket 实时数据
 * @param baseInfo 节点基础信息
 * @param isOnline 是否在线
 * @returns Server 对象
 */
export function createServerFromRealtimeData(
  uuid: string,
  realtimeData: WsNodeRealtime,
  baseInfo: NodeBase,
  isOnline: boolean
): Server {
  const name = baseInfo.name || uuid;
  const alias = baseInfo.public_remark || name;
  const location =
    (baseInfo.region && String(baseInfo.region).trim()) ||
    baseInfo.group ||
    "未知地区";
  const weight = typeof baseInfo.weight === "number" ? baseInfo.weight : 0;

  const hasIPv4 = Boolean(baseInfo.ipv4 && String(baseInfo.ipv4).trim() !== "");
  const hasIPv6 = Boolean(baseInfo.ipv6 && String(baseInfo.ipv6).trim() !== "");
  const online4 = isOnline && hasIPv4;
  const online6 = isOnline && hasIPv6;

  const latestTs = realtimeData?.updated_at
    ? Date.parse(realtimeData.updated_at)
    : Date.now();

  return {
    name,
    alias,
    type: normalizeVirtualizationLabel(baseInfo.virtualization, baseInfo.arch),
    location,
    online: isOnline,
    online4,
    online6,
    uptime: realtimeData?.uptime ? `${Math.floor(realtimeData.uptime)}s` : "",
    load_1: realtimeData?.load?.load1 ?? 0,
    load_5: realtimeData?.load?.load5 ?? 0,
    load_15: realtimeData?.load?.load15 ?? 0,
    network_rx: realtimeData?.network?.down ?? 0,
    network_tx: realtimeData?.network?.up ?? 0,
    network_in: realtimeData?.network?.totalDown ?? 0,
    network_out: realtimeData?.network?.totalUp ?? 0,
    cpu: realtimeData?.cpu?.usage ?? 0,
    memory_total: realtimeData?.ram?.total ?? 0,
    memory_used: realtimeData?.ram?.used ?? 0,
    swap_total: realtimeData?.swap?.total ?? 0,
    swap_used: realtimeData?.swap?.used ?? 0,
    hdd_total: realtimeData?.disk?.total ?? 0,
    hdd_used: realtimeData?.disk?.used ?? 0,
    labels: "",
    weight,
    custom: "",
    gid: uuid,
    latest_ts: latestTs,
    ping_10010: realtimeData?.ping_10010,
    ping_189: realtimeData?.ping_189,
    ping_10086: realtimeData?.ping_10086,
    si: true,
  } as Server;
}
