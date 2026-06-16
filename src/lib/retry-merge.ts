export type RetryOptions = {
  enableRetry?: boolean;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
  onGiveUp?: (error: unknown) => void;
};

export function getBackoffDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  const exp = Math.min(attempt, 10);
  return Math.min(baseDelayMs * Math.pow(2, exp - 1), maxDelayMs);
}

export async function retryAsync<T>(
  task: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    enableRetry = true,
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    onRetry,
    onGiveUp,
  } = options;

  let attempt = 0;
  // attempt: 0 means first try without delay
  // subsequent attempts are delayed with backoff
  for (;;) {
    try {
      return await task();
    } catch (error) {
      attempt += 1;
      if (!enableRetry || attempt > maxRetries) {
        onGiveUp?.(error);
        throw error;
      }
      const delay = getBackoffDelayMs(attempt, baseDelayMs, maxDelayMs);
      onRetry?.(attempt, error, delay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
