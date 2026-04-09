import { log } from "@/lib/observability/logger";

export async function withRetry<T>(
  fn: () => Promise<T>,
  context: { jobName: string; correlationId: string },
  retries = 3
) {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < retries) {
    attempt += 1;
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const backoffMs = 500 * 2 ** (attempt - 1);
      log("warn", "job retry attempt failed", {
        jobName: context.jobName,
        correlationId: context.correlationId,
        attempt,
        backoffMs
      });
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }
  throw lastError;
}
