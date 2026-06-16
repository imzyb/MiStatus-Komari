import { withRetry, type RetryStrategy } from "./rpc-error-handler";

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id: string | number;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number;
}

export interface JsonRpcError extends Error {
  code: number;
  data?: unknown;
}

export interface RpcClientConfig {
  /** RPC 端点 URL */
  endpoint?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 是否启用调试日志 */
  debug?: boolean;
  /** 认证信息 */
  auth?: {
    /** Cookie 认证 */
    cookie?: string;
    /** API Key 认证 */
    apiKey?: string;
  };
  /** 重试策略 */
  retryStrategy?: RetryStrategy;
}

export class RpcClient {
  private config: Required<Omit<RpcClientConfig, "retryStrategy">> & {
    retryStrategy?: RetryStrategy;
  };
  private requestId = 0;

  constructor(config: RpcClientConfig = {}) {
    this.config = {
      endpoint: config.endpoint || "/api/rpc2",
      timeout: config.timeout || 10000,
      debug: config.debug || false,
      auth: config.auth || {},
      retryStrategy: config.retryStrategy,
    };
  }

  /**
   * 生成请求 ID
   */
  private generateId(): string | number {
    return ++this.requestId;
  }

  /**
   * 构建请求头
   */
  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.config.auth.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.auth.apiKey}`;
    }

    if (this.config.auth.cookie) {
      headers["Cookie"] = this.config.auth.cookie;
    }

    return headers;
  }

  /**
   * 记录调试信息
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[RPC Client] ${message}`, data);
    }
  }

  /**
   * 处理 JSON-RPC 错误
   */
  private handleError(error: JsonRpcResponse["error"]): never {
    const rpcError = new Error(
      error?.message || "Unknown RPC error"
    ) as JsonRpcError;
    rpcError.code = error?.code || -32603;
    rpcError.data = error?.data;
    throw rpcError;
  }

  /**
   * 通过 HTTP POST 调用 RPC 方法（带重试）
   */
  async call<T = unknown>(method: string, params?: unknown): Promise<T> {
    const operation = async (): Promise<T> => {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method,
        params,
        id: this.generateId(),
      };

      this.log("Sending RPC request", request);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      try {
        const response = await fetch(this.config.endpoint, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: JsonRpcResponse<T> = await response.json();
        this.log("Received RPC response", result);

        if (result.error) {
          this.handleError(result.error);
        }

        return result.result as T;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    if (this.config.retryStrategy) {
      return withRetry(operation, this.config.retryStrategy);
    } else {
      return operation();
    }
  }

  /**
   * 批量调用多个 RPC 方法
   */
  async batch<T = unknown>(
    calls: Array<{ method: string; params?: unknown }>
  ): Promise<T[]> {
    const requests: JsonRpcRequest[] = calls.map((call) => ({
      jsonrpc: "2.0",
      method: call.method,
      params: call.params,
      id: this.generateId(),
    }));

    this.log("Sending batch RPC requests", requests);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(requests),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const results: JsonRpcResponse<T>[] = await response.json();
      this.log("Received batch RPC responses", results);

      // 服务器可能重新排序批量响应，这里通过 id 重建与请求顺序一致的结果列表
      const idToResponse = new Map<string | number, JsonRpcResponse<T>>();
      for (const res of results) {
        // 忽略没有 id 的响应；稍后在查找时会显式报错
        if (res && res.id !== undefined && res.id !== null) {
          idToResponse.set(res.id, res);
        }
      }

      return requests.map((req) => {
        const matched = idToResponse.get(req.id);
        if (!matched) {
          throw new Error(`Missing response for request id: ${String(req.id)}`);
        }
        if (matched.error) {
          this.handleError(matched.error);
        }
        return matched.result as T;
      });
    } catch (error) {
      this.log("Batch RPC call failed", error);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Batch RPC request timeout");
      }

      throw error;
    }
  }

  /**
   * 健康检查
   */
  async ping(): Promise<string> {
    return this.call<string>("rpc.ping");
  }

  /**
   * 获取 RPC 版本
   */
  async version(): Promise<string> {
    return this.call<string>("rpc.version");
  }

  /**
   * 获取可用方法列表
   */
  async methods(internal = false): Promise<string[]> {
    return this.call<string[]>("rpc.methods", { internal });
  }

  /**
   * 获取方法帮助信息
   */
  async help(method?: string): Promise<unknown> {
    return this.call("rpc.help", method ? { method } : undefined);
  }
}

/**
 * 默认 RPC 客户端实例
 */
export const rpcClient = new RpcClient({
  debug: process.env.NODE_ENV === "development",
});

/**
 * 创建新的 RPC 客户端实例
 */
export function createRpcClient(config?: RpcClientConfig): RpcClient {
  return new RpcClient(config);
}
