import { rpcAdapter } from "./rpc-adapter";
import type { NodesSnapshotResult } from "./rpc-adapter";
import type { MeInfo, VersionInfo, Client, NodeStatus } from "./rpc-types";
import { normalizeVirtualizationLabel } from "./utils";

// 重新导出 RPC 类型
export type {
  Client,
  NodeStatus,
  PublicInfo,
  MeInfo,
  VersionInfo,
} from "./rpc-types";

// 定义服务器类型
export interface Server {
  name: string;
  alias: string;
  type: string;
  location: string;
  online: boolean;
  online4: boolean;
  online6: boolean;
  uptime: string;
  load_1: number;
  load_5: number;
  load_15: number;
  network_rx: number;
  network_tx: number;
  network_in: number;
  network_out: number;
  cpu: number;
  memory_total: number;
  memory_used: number;
  swap_total: number;
  swap_used: number;
  hdd_total: number;
  hdd_used: number;
  labels: string;
  weight: number;
  custom: string;
  gid: string;
  last_network_in?: number;
  last_network_out?: number;
  notify?: boolean;
  vnstat?: boolean;
  ping_10010?: number;
  ping_189?: number;
  ping_10086?: number;
  time_10010?: number;
  time_189?: number;
  time_10086?: number;
  tcp_count?: number;
  udp_count?: number;
  process_count?: number;
  thread_count?: number;
  latest_ts?: number;
  si?: boolean;
}

// 定义API响应类型
export interface StatsResponse {
  updated: number;
  servers: Server[];
}

// 历史 REST/RPC 拉取聚合状态的实现已删除，实时数据改由 WebSocket 提供

/**
 * 地区分组类型
 */
export interface RegionGroup {
  region: string;
  servers: Server[];
}

/**
 * 根据服务器location字段按地区分组
 * @param servers 服务器列表
 * @returns 按地区分组的服务器
 */
export const groupServersByRegion = (servers: Server[]): RegionGroup[] => {
  const groups = new Map<string, Server[]>();

  servers.forEach((server) => {
    const region = server.location || "未知地区";
    if (!groups.has(region)) {
      groups.set(region, []);
    }
    groups.get(region)!.push(server);
  });

  // 转换为数组并按地区名排序
  return Array.from(groups.entries())
    .map(([region, servers]) => ({ region, servers }))
    .sort((a, b) => {
      // 将"未知地区"排到最后
      if (a.region === "未知地区") return 1;
      if (b.region === "未知地区") return -1;
      return a.region.localeCompare(b.region, "zh-CN");
    });
};

/**
 * 获取所有唯一的地区列表
 * @param servers 服务器列表
 * @returns 地区列表
 */
export const getUniqueRegions = (servers: Server[]): string[] => {
  const regions = new Set(
    servers.map((server) => server.location || "未知地区")
  );
  return Array.from(regions).sort((a, b) => {
    if (a === "未知地区") return 1;
    if (b === "未知地区") return -1;
    return a.localeCompare(b, "zh-CN");
  });
};

/**
 * Komari 通用响应结构
 */
export interface KomariResponse<T = unknown> {
  status: "success" | "error";
  data?: T;
  message?: string;
}

/**
 * 获取 Komari 公开信息（站点名、描述等）
 * 优先使用 RPC 接口，失败时回退到 REST API
 * 返回结构与页面期望保持一致：{ status, data }
 * @param baseUrl 可选的基URL，用于服务端渲染时构建绝对路径
 */
export const getKomariPublicInfo = async (
  baseUrl?: string
): Promise<KomariResponse<{ sitename?: string; description?: string }>> => {
  try {
    // 优先使用 RPC 接口
    const publicInfo = await rpcAdapter.getPublicInfo();

    return {
      status: "success",
      data: {
        sitename: publicInfo.sitename,
        description: publicInfo.description,
      },
    };
  } catch (error) {
    console.error("获取 Komari 公开信息失败:", error);

    // RPC 失败时的回退逻辑
    try {
      const url = baseUrl ? `${baseUrl}/api/public` : "/api/public";
      const response = await fetch(url, { next: { revalidate: 1 } });
      if (!response.ok) {
        return { status: "error", message: `HTTP ${response.status}` };
      }
      const payload = await response.json();
      // 兼容形如 { status, message, data } 的结构
      if (payload && payload.status === "success") {
        return { status: "success", data: payload.data };
      }
      return {
        status: "error",
        message: payload?.message || "Unexpected response",
      };
    } catch (fallbackError) {
      return { status: "error", message: (fallbackError as Error).message };
    }
  }
};

/**
 * 获取当前用户信息
 * 优先使用 RPC 接口，失败时回退到 REST API
 */
export const getMeInfo = async (): Promise<MeInfo> => {
  return rpcAdapter.getMe();
};

/**
 * 获取版本信息
 * 优先使用 RPC 接口，失败时回退到 REST API
 */
export const getVersionInfo = async (): Promise<VersionInfo> => {
  return rpcAdapter.getVersion();
};

/**
 * 获取节点信息
 * 优先使用 RPC 接口，失败时回退到 REST API
 */
export const getNodesInfo = async (
  uuid?: string
): Promise<Client | Record<string, Client>> => {
  return rpcAdapter.getNodes(uuid ? { uuid } : undefined);
};

/**
 * 获取节点最新状态
 * 优先使用 RPC 接口，失败时回退到 REST API
 */
export const getNodesLatestStatus = async (
  uuid?: string,
  uuids?: string[]
): Promise<Record<string, NodeStatus>> => {
  return rpcAdapter.getNodesLatestStatus({ uuid, uuids });
};

/**
 * 批量获取节点信息与最新状态
 */
export const getNodesSnapshot = async (params?: {
  uuid?: string;
  uuids?: string[];
}): Promise<NodesSnapshotResult> => {
  return rpcAdapter.getNodesSnapshot(params);
};

/**
 * 将 RPC 的 Client 对象转换为 Server 对象
 * 用于兼容现有的 Server 接口
 */
export const convertClientToServer = (
  client: Client,
  status?: NodeStatus
): Server => {
  const hasIPv4 = Boolean(client.ipv4 && String(client.ipv4).trim() !== "");
  const hasIPv6 = Boolean(client.ipv6 && String(client.ipv6).trim() !== "");
  const isOnline = status?.online ?? false;
  const parsedStatusTime = status?.time ? Date.parse(status.time) : NaN;

  return {
    name: client.name,
    alias: client.public_remark || client.name,
    type: normalizeVirtualizationLabel(client.virtualization, client.arch),
    location: client.region || client.group || "未知地区",
    online: isOnline,
    online4: isOnline && hasIPv4,
    online6: isOnline && hasIPv6,
    uptime: status
      ? (() => {
          // 优先使用后端直接提供的 uptime（部分部署会返回该字段，单位：秒）
          const maybeUptime: unknown = (
            status as unknown as { uptime?: unknown }
          )?.uptime;
          if (
            typeof maybeUptime === "number" &&
            Number.isFinite(maybeUptime) &&
            maybeUptime >= 0
          ) {
            return `${Math.floor(maybeUptime)}s`;
          }
          // 回退：将 status.time 视为最近心跳的绝对时间戳，转换为“秒数”
          if (Number.isFinite(parsedStatusTime)) {
            const diffMs = Date.now() - (parsedStatusTime as number);
            const seconds = diffMs >= 0 ? Math.floor(diffMs / 1000) : 0;
            return `${seconds}s`;
          }
          return "0s";
        })()
      : "",
    load_1: status?.load ?? 0,
    load_5: status?.load5 ?? 0,
    load_15: status?.load15 ?? 0,
    network_rx: status?.net_out ?? 0,
    network_tx: status?.net_in ?? 0,
    network_in: status?.net_total_down ?? 0,
    network_out: status?.net_total_up ?? 0,
    cpu: status?.cpu ?? 0,
    memory_total: status?.ram_total ?? client.mem_total,
    memory_used: status?.ram ?? 0,
    swap_total: status?.swap_total ?? client.swap_total,
    swap_used: status?.swap ?? 0,
    hdd_total: status?.disk_total ?? client.disk_total,
    hdd_used: status?.disk ?? 0,
    labels: client.tags || "",
    weight: client.weight,
    custom: "",
    gid: client.uuid,
    latest_ts: Number.isFinite(parsedStatusTime) ? parsedStatusTime : undefined,
    ping_10010: (status as unknown as { ping_10010?: number })?.ping_10010,
    ping_189: (status as unknown as { ping_189?: number })?.ping_189,
    ping_10086: (status as unknown as { ping_10086?: number })?.ping_10086,
    si: true,
  };
};
