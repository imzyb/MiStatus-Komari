/**
 * RPC 错误处理和状态码映射
 * 提供统一的错误处理机制和状态码转换
 */

export interface RpcErrorInfo {
  /** 错误代码 */
  code: number;
  /** 错误消息 */
  message: string;
  /** 错误类型 */
  type: 'network' | 'rpc' | 'auth' | 'validation' | 'server' | 'unknown';
  /** 是否可重试 */
  retryable: boolean;
  /** 建议的重试延迟（毫秒） */
  retryDelay?: number;
  /** 原始错误数据 */
  data?: unknown;
}

/**
 * JSON-RPC 2.0 标准错误代码
 */
export const RPC_ERROR_CODES = {
  // JSON-RPC 2.0 标准错误代码
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,

  // 自定义错误代码范围 (-32000 到 -32099)
  AUTHENTICATION_FAILED: -32001,
  AUTHORIZATION_FAILED: -32002,
  RATE_LIMIT_EXCEEDED: -32003,
  SERVICE_UNAVAILABLE: -32004,
  TIMEOUT: -32005,
  VALIDATION_ERROR: -32006,
  NOT_FOUND: -32007,
  CONFLICT: -32008,
} as const;

/**
 * HTTP 状态码到 RPC 错误代码的映射
 */
export const HTTP_TO_RPC_ERROR_MAP: Record<number, number> = {
  400: RPC_ERROR_CODES.INVALID_REQUEST,
  401: RPC_ERROR_CODES.AUTHENTICATION_FAILED,
  403: RPC_ERROR_CODES.AUTHORIZATION_FAILED,
  404: RPC_ERROR_CODES.NOT_FOUND,
  409: RPC_ERROR_CODES.CONFLICT,
  422: RPC_ERROR_CODES.VALIDATION_ERROR,
  429: RPC_ERROR_CODES.RATE_LIMIT_EXCEEDED,
  500: RPC_ERROR_CODES.INTERNAL_ERROR,
  502: RPC_ERROR_CODES.SERVICE_UNAVAILABLE,
  503: RPC_ERROR_CODES.SERVICE_UNAVAILABLE,
  504: RPC_ERROR_CODES.TIMEOUT,
};

/**
 * 错误类型分类
 */
export function classifyError(error: unknown): RpcErrorInfo {
  // 网络错误
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: RPC_ERROR_CODES.SERVICE_UNAVAILABLE,
      message: '网络连接失败',
      type: 'network',
      retryable: true,
      retryDelay: 1000,
    };
  }

  // 超时错误
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      code: RPC_ERROR_CODES.TIMEOUT,
      message: '请求超时',
      type: 'network',
      retryable: true,
      retryDelay: 2000,
    };
  }

  // RPC 错误
  if (error && typeof error === 'object' && 'code' in error) {
    const rpcError = error as { code: number; message: string; data?: unknown };
    return {
      code: rpcError.code,
      message: rpcError.message,
      type: getRpcErrorType(rpcError.code),
      retryable: isRetryableRpcError(rpcError.code),
      retryDelay: getRetryDelay(rpcError.code),
      data: rpcError.data,
    };
  }

  // HTTP 错误
  if (error instanceof Response) {
    const rpcCode = HTTP_TO_RPC_ERROR_MAP[error.status] || RPC_ERROR_CODES.INTERNAL_ERROR;
    return {
      code: rpcCode,
      message: `HTTP ${error.status}: ${error.statusText}`,
      type: getRpcErrorType(rpcCode),
      retryable: isRetryableHttpError(error.status),
      retryDelay: getRetryDelay(rpcCode),
    };
  }

  // 通用错误
  const message = error instanceof Error ? error.message : '未知错误';
  return {
    code: RPC_ERROR_CODES.INTERNAL_ERROR,
    message,
    type: 'unknown',
    retryable: false,
  };
}

/**
 * 根据 RPC 错误代码获取错误类型
 */
function getRpcErrorType(code: number): RpcErrorInfo['type'] {
  if (code >= -32099 && code <= -32000) {
    // 自定义错误代码范围
    switch (code) {
      case RPC_ERROR_CODES.AUTHENTICATION_FAILED:
      case RPC_ERROR_CODES.AUTHORIZATION_FAILED:
        return 'auth';
      case RPC_ERROR_CODES.VALIDATION_ERROR:
        return 'validation';
      case RPC_ERROR_CODES.SERVICE_UNAVAILABLE:
      case RPC_ERROR_CODES.TIMEOUT:
        return 'server';
      default:
        return 'rpc';
    }
  }

  // JSON-RPC 2.0 标准错误代码
  if (code >= -32768 && code <= -32000) {
    switch (code) {
      case RPC_ERROR_CODES.PARSE_ERROR:
      case RPC_ERROR_CODES.INVALID_REQUEST:
      case RPC_ERROR_CODES.INVALID_PARAMS:
        return 'validation';
      case RPC_ERROR_CODES.METHOD_NOT_FOUND:
        return 'rpc';
      case RPC_ERROR_CODES.INTERNAL_ERROR:
        return 'server';
      default:
        return 'rpc';
    }
  }

  return 'unknown';
}

/**
 * 判断 RPC 错误是否可重试
 */
function isRetryableRpcError(code: number): boolean {
  const retryableCodes: number[] = [
    RPC_ERROR_CODES.SERVICE_UNAVAILABLE,
    RPC_ERROR_CODES.TIMEOUT,
    RPC_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    RPC_ERROR_CODES.INTERNAL_ERROR,
  ];
  return retryableCodes.includes(code);
}

/**
 * 判断 HTTP 错误是否可重试
 */
function isRetryableHttpError(status: number): boolean {
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(status);
}

/**
 * 获取建议的重试延迟
 */
function getRetryDelay(code: number): number {
  switch (code) {
    case RPC_ERROR_CODES.RATE_LIMIT_EXCEEDED:
      return 5000; // 5秒
    case RPC_ERROR_CODES.SERVICE_UNAVAILABLE:
    case RPC_ERROR_CODES.TIMEOUT:
      return 2000; // 2秒
    case RPC_ERROR_CODES.INTERNAL_ERROR:
      return 1000; // 1秒
    default:
      return 1000;
  }
}

/**
 * 错误重试策略
 */
export interface RetryStrategy {
  /** 最大重试次数 */
  maxRetries: number;
  /** 基础延迟（毫秒） */
  baseDelay: number;
  /** 最大延迟（毫秒） */
  maxDelay: number;
  /** 是否使用指数退避 */
  exponentialBackoff: boolean;
  /** 重试条件 */
  shouldRetry: (error: RpcErrorInfo, attempt: number) => boolean;
}

/**
 * 默认重试策略
 */
export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBackoff: true,
  shouldRetry: (error: RpcErrorInfo, attempt: number) => {
    return error.retryable && attempt < 3;
  },
};

/**
 * 执行带重试的 RPC 调用
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  strategy: RetryStrategy = DEFAULT_RETRY_STRATEGY
): Promise<T> {
  let lastError: RpcErrorInfo | null = null;

  for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = classifyError(error);

      if (attempt === strategy.maxRetries || !strategy.shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // 计算延迟时间
      let delay = strategy.baseDelay;
      if (strategy.exponentialBackoff) {
        delay = Math.min(
          strategy.baseDelay * Math.pow(2, attempt),
          strategy.maxDelay
        );
      }

      // 使用建议的延迟时间（如果可用）
      if (lastError.retryDelay) {
        delay = Math.min(delay, lastError.retryDelay);
      }

      console.warn(
        `RPC call failed (attempt ${attempt + 1}/${strategy.maxRetries + 1}), retrying in ${delay}ms:`,
        lastError.message
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Unknown error');
}
