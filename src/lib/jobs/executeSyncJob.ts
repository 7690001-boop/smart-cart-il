import { NextRequest, NextResponse } from "next/server";
import { ensureJobNotProcessed, markJobFinished } from "@/lib/jobs/idempotency";
import { withRetry } from "@/lib/jobs/retry";
import { allowRequest } from "@/lib/rateLimit";
import { log } from "@/lib/observability/logger";

function resolveIdempotencyKey(request: NextRequest, fallbackPrefix: string) {
  return request.headers.get("x-idempotency-key") ?? `${fallbackPrefix}-${new Date().toISOString().slice(0, 10)}`;
}

function resolveCorrelationId(request: NextRequest, fallbackPrefix: string) {
  return request.headers.get("x-correlation-id") ?? `${fallbackPrefix}-${Date.now()}`;
}

function authorizeJobRequest(request: NextRequest) {
  const apiKey = process.env.INGESTION_API_KEY;
  if (!apiKey) return true;
  return request.headers.get("x-api-key") === apiKey;
}

export async function executeManagedSyncJob(
  request: NextRequest,
  options: {
    routeKey: string;
    jobName: string;
    run: (context: { correlationId: string; idempotencyKey: string }) => Promise<unknown>;
  }
) {
  if (!authorizeJobRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const callerKey = request.headers.get("x-api-key") ?? "anonymous";
  if (!allowRequest(`${options.routeKey}:${callerKey}`, 30, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const idempotencyKey = resolveIdempotencyKey(request, options.routeKey);
  const correlationId = resolveCorrelationId(request, options.routeKey);

  const shouldRun = await ensureJobNotProcessed(options.jobName, idempotencyKey);
  if (!shouldRun) {
    return NextResponse.json({ status: "duplicate-suppressed", idempotencyKey, correlationId });
  }

  try {
    const data = await withRetry(
      () => options.run({ correlationId, idempotencyKey }),
      { jobName: options.jobName, correlationId },
      3
    );
    await markJobFinished(idempotencyKey, "success");
    return NextResponse.json({ correlationId, idempotencyKey, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";
    await markJobFinished(idempotencyKey, "failed", message);
    log("error", "managed sync job failed", { jobName: options.jobName, correlationId, message });
    return NextResponse.json({ error: message, correlationId, idempotencyKey }, { status: 500 });
  }
}
