export async function withRetry<T>(
  action: () => Promise<T>,
  options?: {
    retries?: number;
    shouldRetry?: (error: unknown) => boolean;
    delayMs?: number;
  },
): Promise<T> {
  const retries = options?.retries ?? 0;
  const delayMs = options?.delayMs ?? 150;
  const shouldRetry = options?.shouldRetry ?? (() => true);

  let attempt = 0;
  while (true) {
    try {
      return await action();
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}