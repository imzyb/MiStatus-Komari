/**
 * RPC 接口类型定义
 * 基于 rpc.md 文档中的接口规范
 */

// ==================== 基础类型 ====================

export interface VersionInfo {
  version: string;
  hash: string;
}

export interface MeInfo {
  '2fa_enabled': boolean;
  logged_in: boolean;
  sso_id: string;
  sso_type: string;
  username: string;
  uuid: string;
}

export interface PublicInfo {
  allow_cors: boolean;
  custom_body: string;
  custom_head: string;
  description: string;
  disable_password_login: boolean;
  oauth_enable: boolean;
  oauth_provider: string;
  ping_record_preserve_time: number;
  private_site: boolean;
  record_enabled: boolean;
  record_preserve_time: number;
  sitename: string;
  theme: string;
  theme_settings: Record<string, unknown>;
}

export interface Client {
  uuid: string;
  token: string;
  name: string;
  cpu_name: string;
  virtualization: string;
  arch: string;
  cpu_cores: number;
  os: string;
  kernel_version: string;
  gpu_name: string;
  ipv4: string;
  ipv6: string;
  region: string;
  remark: string;
  public_remark: string;
  mem_total: number;
  swap_total: number;
  disk_total: number;
  version: string;
  weight: number;
  price: number;
  billing_cycle: number;
  auto_renewal: boolean;
  currency: string;
  expired_at: string;
  group: string;
  tags: string;
  hidden: boolean;
  traffic_limit: number;
  traffic_limit_type: string;
  created_at: string;
  updated_at: string;
}

export interface NodeStatus {
  client: string;
  time: string;
  cpu: number;
  gpu: number;
  ram: number;
  ram_total: number;
  swap: number;
  swap_total: number;
  load: number;
  load5: number;
  load15: number;
  temp: number;
  disk: number;
  disk_total: number;
  net_in: number;
  net_out: number;
  net_total_up: number;
  net_total_down: number;
  process: number;
  connections: number;
  connections_udp: number;
  online: boolean;
}

export interface StatusRecord {
  client: string;
  time: string;
  cpu: number;
  gpu: number;
  ram: number;
  ram_total: number;
  swap: number;
  swap_total: number;
  load: number;
  temp: number;
  disk: number;
  disk_total: number;
  net_in: number;
  net_out: number;
  net_total_up: number;
  net_total_down: number;
  process: number;
  connections: number;
  connections_udp: number;
}

export interface RecentStatusResp {
  count: number;
  records: StatusRecord[];
}

export interface BasicInfo {
  client: string;
  loss: number;
  min: number;
  max: number;
}

export interface PingRecord {
  task_id: number;
  time: string;
  value: number;
  client: string;
}

export interface LoadRecordsResult {
  count: number;
  records: StatusRecord[];
  from: string;
  to: string;
}

export interface LoadRecordsAllResult {
  count: number;
  records: Record<string, StatusRecord[]>;
  from: string;
  to: string;
}

export interface PingRecordsResult {
  count: number;
  basic_info: BasicInfo[];
  records: PingRecord[];
  from: string;
  to: string;
}

// ==================== RPC 方法参数类型 ====================

export interface GetNodesParams {
  uuid?: string;
}

export interface GetNodesLatestStatusParams {
  uuid?: string;
  uuids?: string[];
}

export interface GetNodeRecentStatusParams {
  uuid: string;
}

export interface GetRecordsParams {
  type?: 'load' | 'ping';
  uuid?: string;
  hours?: number;
  start?: string;
  end?: string;
  load_type?: 'cpu' | 'gpu' | 'ram' | 'swap' | 'load' | 'temp' | 'disk' | 'network' | 'process' | 'connections' | 'all';
  task_id?: number;
  maxCount?: number;
}

// ==================== RPC 方法返回类型映射 ====================

export type RpcMethodReturns = {
  'rpc.ping': string;
  'rpc.version': string;
  'rpc.methods': string[];
  'rpc.help': unknown;
  'common:getMe': MeInfo;
  'common:getPublicInfo': PublicInfo;
  'common:getVersion': VersionInfo;
  'common:getNodes': Client | Record<string, Client>;
  'common:getNodesLatestStatus': Record<string, NodeStatus>;
  'common:getNodeRecentStatus': RecentStatusResp;
  'common:getRecords': LoadRecordsResult | LoadRecordsAllResult | PingRecordsResult;
};

export type RpcMethodParams = {
  'rpc.ping': undefined;
  'rpc.version': undefined;
  'rpc.methods': { internal?: boolean };
  'rpc.help': { method?: string };
  'common:getMe': undefined;
  'common:getPublicInfo': undefined;
  'common:getVersion': undefined;
  'common:getNodes': GetNodesParams;
  'common:getNodesLatestStatus': GetNodesLatestStatusParams;
  'common:getNodeRecentStatus': GetNodeRecentStatusParams;
  'common:getRecords': GetRecordsParams;
};

// ==================== 类型安全的 RPC 调用接口 ====================

export interface TypedRpcClient {
  call<K extends keyof RpcMethodReturns>(
    method: K,
    params?: RpcMethodParams[K]
  ): Promise<RpcMethodReturns[K]>;
}
