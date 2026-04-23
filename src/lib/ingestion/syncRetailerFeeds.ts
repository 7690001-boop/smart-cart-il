import { upsertFromCentralFeed } from "@/lib/ingestion/centralFeed";
import { appendIngestionRun } from "@/lib/ingestion/history";
import { getRetailerProviderFromEnv } from "@/lib/ingestion/retailerFeeds";
import { IngestionRunRecord } from "@/lib/types";
import { log } from "@/lib/observability/logger";

export async function syncRetailerFeeds(context?: { correlationId?: string; idempotencyKey?: string }) {
  const run: IngestionRunRecord = {
    id: `ing-ret-${Date.now()}`,
    source: "retailer-web-feeds",
    startedAt: new Date().toISOString(),
    status: "failed",
    fetchedItems: 0,
    ingestedRows: 0,
    correlationId: context?.correlationId,
    idempotencyKey: context?.idempotencyKey
  };

  try {
    const provider = getRetailerProviderFromEnv();
    const items = await provider.fetchAllItems();
    const result = upsertFromCentralFeed(items);
    run.status = "success";
    run.fetchedItems = items.length;
    run.ingestedRows = result.ingestedRows;
    run.finishedAt = new Date().toISOString();
    await appendIngestionRun(run);
    log("info", "retailer feeds sync success", {
      correlationId: context?.correlationId,
      fetchedItems: run.fetchedItems,
      ingestedRows: run.ingestedRows
    });
    return run;
  } catch (error) {
    run.errorMessage = error instanceof Error ? error.message : "Retailer sync failed";
    run.finishedAt = new Date().toISOString();
    await appendIngestionRun(run);
    log("error", "retailer feeds sync failed", {
      correlationId: context?.correlationId,
      errorMessage: run.errorMessage
    });
    throw error;
  }
}
