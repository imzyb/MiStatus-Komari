/**
 * RPC 适配层
 * 提供 REST API 到 RPC 的转换和兼容性支持
 */

import { RpcClient } from './rpc-client';
import type {
  VersionInfo,
  MeInfo,
  PublicInfo,
  Client,
  NodeStatus,
  RecentStatusResp,
  LoadRecordsResult,
  LoadRecordsAllResult,
  PingRecordsResult,
  GetNodesParams,
  GetNodesLatestStatusParams,
  GetNodeRecentStatusParams,
  GetRecordsParams
} from './rpc-types';

const isDev = process.env.NODE_ENV !== 'production';

export interface NodesSnapshotResult {
  nodes: Client | Record<string, Client>;
  statuses: Record<string, NodeStatus>;
}

export interface RpcAdapterConfig {
  /** 是否启用 RPC */
  enabled: boolean;
  /** 是否启用双写模式（同时调用 REST 和 RPC） */
  dualWrite: boolean;
  /** 是否启用回退机制（RPC 失败时回退到 REST） */
  fallback: boolean;
  /** RPC 客户端配置 */
  rpcClient?: RpcClient;
}

export class RpcAdapter {
  private config: Required<RpcAdapterConfig>;
  private rpcClient: RpcClient;
  private nodesSnapshotRequests = new Map<string, Promise<NodesSnapshotResult>>();
  private nodesSnapshotCache = new Map<string, { data: NodesSnapshotResult; expiresAt: number }>();
  private readonly nodesSnapshotCacheDuration = 500;

  constructor(config: RpcAdapterConfig = { enabled: true, dualWrite: false, fallback: true }) {
    this.config = {
      enabled: config.enabled,
      dualWrite: config.dualWrite,
      fallback: config.fallback,
      rpcClient: config.rpcClient || new RpcClient()
    };
    this.rpcClient = this.config.rpcClient;
  }

  /**
   * 获取当前用户信息
   * REST: GET /api/me -> RPC: common:getMe
   */
  async getMe(): Promise<MeInfo> {
    if (!this.config.enabled) {
      return this.fallbackToRest('/api/me');
    }

    try {
      return await this.rpcClient.call<MeInfo>('common:getMe');
    } catch (error) {
      if (this.config.fallback) {
        if (isDev) console.warn('RPC getMe failed, falling back to REST:', error);
        return this.fallbackToRest('/api/me');
      }
      throw error;
    }
  }

  /**
   * 获取公开信息
   * REST: GET /api/public -> RPC: common:getPublicInfo
   */
  async getPublicInfo(): Promise<PublicInfo> {
    if (!this.config.enabled) {
      return this.fallbackToRest('/api/public');
    }

    try {
      return await this.rpcClient.call<PublicInfo>('common:getPublicInfo');
    } catch (error) {
      if (this.config.fallback) {
        if (isDev) console.warn('RPC getPublicInfo failed, falling back to REST:', error);
        return this.fallbackToRest('/api/public');
      }
      throw error;
    }
  }

  /**
   * 获取版本信息
   * REST: GET /api/version -> RPC: common:getVersion
   */
  async getVersion(): Promise<VersionInfo> {
    if (!this.config.enabled) {
      return this.fallbackToRest('/api/version');
    }

    try {
      return await this.rpcClient.call<VersionInfo>('common:getVersion');
    } catch (error) {
      if (this.config.fallback) {
        if (isDev) console.warn('RPC getVersion failed, falling back to REST:', error);
        return this.fallbackToRest('/api/version');
      }
      throw error;
    }
  }

  /**
   * 获取节点信息
   * REST: GET /api/nodes -> RPC: common:getNodes
   */
  async getNodes(params?: GetNodesParams): Promise<Client | Record<string, Client>> {
    if (!this.config.enabled) {
      return this.fallbackToRest('/api/nodes');
    }

    try {
      const snapshotParams = params?.uuid ? { uuid: params.uuid } : undefined;
      const snapshot = await this.getNodesSnapshotInternal(snapshotParams);
      return snapshot.nodes;
    } catch (error) {
      if (this.config.fallback) {
        if (isDev) console.warn('RPC getNodes failed, falling back to REST:', error);
        return this.fallbackToRest('/api/nodes');
      }
      throw error;
    }
  }

  /**
   * 获取节点最新状态
   * REST: GET /api/recent/{uuid} -> RPC: common:getNodesLatestStatus
   */
  async getNodesLatestStatus(params?: GetNodesLatestStatusParams): Promise<Record<string, NodeStatus>> {
    if (!this.config.enabled) {
      // REST API 需要不同的处理方式
      if (params?.uuid) {
        return this.fallbackToRest(`/api/recent/${params.uuid}`);
      }
      throw new Error('REST API does not support getting all nodes latest status');
    }

    try {
      const snapshot = await this.getNodesSnapshotInternal(params);
      return snapshot.statuses;
    } catch (error) {
      if (this.config.fallback && params?.uuid) {
        if (isDev) console.warn('RPC getNodesLatestStatus failed, falling back to REST:', error);
        return this.fallbackToRest(`/api/recent/${params.uuid}`);
      }
      throw error;
    }
  }

  /**
   * 获取节点最近状态记录
   * REST: GET /api/recent/{uuid} -> RPC: common:getNodeRecentStatus
   */
  async getNodeRecentStatus(params: GetNodeRecentStatusParams): Promise<RecentStatusResp> {
    if (!this.config.enabled) {
      return this.fallbackToRest(`/api/recent/${params.uuid}`);
    }

    try {
      return await this.rpcClient.call<RecentStatusResp>('common:getNodeRecentStatus', params);
    } catch (error) {
      if (this.config.fallback) {
        if (isDev) console.warn('RPC getNodeRecentStatus failed, falling back to REST:', error);
        return this.fallbackToRest(`/api/recent/${params.uuid}`);
      }
      throw error;
    }
  }

  /**
   * 批量获取节点信息与最新状态
   * 使用 JSON-RPC 批量调用降低 /api/rpc2 请求次数
   */
  async getNodesSnapshot(params?: GetNodesLatestStatusParams): Promise<NodesSnapshotResult> {
    if (!this.config.enabled) {
      throw new Error('getNodesSnapshot requires RPC to be enabled');
    }

    return this.getNodesSnapshotInternal(params);
  }

  /**
   * 获取历史记录
   * REST: GET /api/records/load, GET /api/records/ping -> RPC: common:getRecords
   */
  async getRecords(params: GetRecordsParams): Promise<LoadRecordsResult | LoadRecordsAllResult | PingRecordsResult> {
    if (!this.config.enabled) {
      // REST API 需要根据类型选择不同的端点
      const endpoint = params.type === 'ping' ? '/api/records/ping' : '/api/records/load';
      const queryParams = new URLSearchParams();

      if (params.uuid) queryParams.set('uuid', params.uuid);
      if (params.hours) queryParams.set('hours', params.hours.toString());

      const url = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
      return this.fallbackToRest(url);
    }

    try {
      return await this.rpcClient.call<LoadRecordsResult | LoadRecordsAllResult | PingRecordsResult>('common:getRecords', params);
    } catch (error) {
      if (this.config.fallback) {
        if (isDev) console.warn('RPC getRecords failed, falling back to REST:', error);
        const endpoint = params.type === 'ping' ? '/api/records/ping' : '/api/records/load';
        const queryParams = new URLSearchParams();

        if (params.uuid) queryParams.set('uuid', params.uuid);
        if (params.hours) queryParams.set('hours', params.hours.toString());

        const url = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
        return this.fallbackToRest(url);
      }
      throw error;
    }
  }

  /**
   * 回退到 REST API
   */
  private async fallbackToRest<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 处理 REST API 的响应格式 { status, data, message }
      if (data && typeof data === 'object' && 'status' in data) {
        if (data.status === 'success') {
          return data.data;
        } else {
          throw new Error(data.message || 'REST API error');
        }
      }

      return data;
    } catch (error) {
      if (isDev) console.error('REST API fallback failed:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async ping(): Promise<string> {
    try {
      return await this.rpcClient.ping();
    } catch (error) {
      if (this.config.fallback) {
        if (isDev) console.warn('RPC ping failed, falling back to REST health check');
        try {
          const response = await fetch('/api/version');
          if (response.ok) {
            return 'pong';
          }
        } catch {
          // 忽略 REST 健康检查失败
        }
      }
      throw error;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RpcAdapterConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.rpcClient) {
      this.rpcClient = config.rpcClient;
    }
    this.nodesSnapshotRequests.clear();
    this.nodesSnapshotCache.clear();
  }

  /**
   * 获取当前配置
   */
  getConfig(): Required<RpcAdapterConfig> {
    return { ...this.config };
  }

  private getNodesSnapshotCacheKey(params?: GetNodesLatestStatusParams): string {
    if (!params) {
      return 'all';
    }

    if (params.uuid) {
      return `uuid:${params.uuid}`;
    }

    if (params.uuids && params.uuids.length > 0) {
      const sorted = [...params.uuids].sort();
      return `uuids:${sorted.join(',')}`;
    }

    return 'all';
  }

  private getNodesSnapshotInternal(params?: GetNodesLatestStatusParams): Promise<NodesSnapshotResult> {
    const cacheKey = this.getNodesSnapshotCacheKey(params);
    const existing = this.nodesSnapshotRequests.get(cacheKey);
    if (existing) {
      return existing;
    }

    const cached = this.nodesSnapshotCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(cached.data);
    }

    const requestWithCache = this.performNodesSnapshotRequest(params).then(result => {
      if (this.nodesSnapshotCacheDuration > 0) {
        this.nodesSnapshotCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + this.nodesSnapshotCacheDuration
        });
      }
      return result;
    });
    const trackedRequest = requestWithCache.finally(() => {
      if (this.nodesSnapshotRequests.get(cacheKey) === trackedRequest) {
        this.nodesSnapshotRequests.delete(cacheKey);
      }
      const cachedEntry = this.nodesSnapshotCache.get(cacheKey);
      if (cachedEntry && cachedEntry.expiresAt <= Date.now()) {
        this.nodesSnapshotCache.delete(cacheKey);
      }
    });

    this.nodesSnapshotRequests.set(cacheKey, trackedRequest);
    return trackedRequest;
  }

  private async performNodesSnapshotRequest(params?: GetNodesLatestStatusParams): Promise<NodesSnapshotResult> {
    const calls: Array<{ method: string; params?: unknown }> = [];
    const nodesParams = params?.uuid ? { uuid: params.uuid } : undefined;

    calls.push(
      nodesParams
        ? { method: 'common:getNodes', params: nodesParams }
        : { method: 'common:getNodes' }
    );
    calls.push(
      params
        ? { method: 'common:getNodesLatestStatus', params }
        : { method: 'common:getNodesLatestStatus' }
    );

    try {
      const [nodes, statuses] = await this.rpcClient.batch(calls);

      return {
        nodes: nodes as Client | Record<string, Client>,
        statuses: statuses as Record<string, NodeStatus>
      };
    } catch (error) {
      if (this.config.fallback) {
        if (isDev) console.warn('RPC getNodesSnapshot failed, falling back to sequential RPC calls:', error);
        const nodesPromise = nodesParams
          ? this.rpcClient.call<Client | Record<string, Client>>('common:getNodes', nodesParams)
          : this.rpcClient.call<Client | Record<string, Client>>('common:getNodes');
        const statusPromise = params
          ? this.rpcClient.call<Record<string, NodeStatus>>('common:getNodesLatestStatus', params)
          : this.rpcClient.call<Record<string, NodeStatus>>('common:getNodesLatestStatus');

        const [nodes, statuses] = await Promise.all([nodesPromise, statusPromise]);
        return {
          nodes,
          statuses
        };
      }
      throw error;
    }
  }
}

/**
 * 默认 RPC 适配器实例
 */
export const rpcAdapter = new RpcAdapter({
  enabled: true,
  dualWrite: false,
  fallback: true
});
