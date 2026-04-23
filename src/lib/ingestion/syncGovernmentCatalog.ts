import { upsertFromCentralFeed } from "@/lib/ingestion/centralFeed";
import { getGovernmentCatalogProviderFromEnv } from "@/lib/ingestion/governmentCatalog";
import { appendIngestionRun } from "@/lib/ingestion/history";
import { IngestionRunRecord } from "@/lib/types";
import { log } from "@/lib/observability/logger";

export async function syncAllGovernmentItems(context?: { correlationId?: string; idempotencyKey?: string }) {
  const run: IngestionRunRecord = {
    id: `ing-${Date.now()}`,
    source: "government-catalog",
    startedAt: new Date().toISOString(),
    status: "failed",
    fetchedItems: 0,
    ingestedRows: 0,
    correlationId: context?.correlationId,
    idempotencyKey: context?.idempotencyKey
  };

  try {
    log("info", "starting government catalog sync", { correlationId: context?.correlationId });
    const provider = getGovernmentCatalogProviderFromEnv();
    const items = await provider.fetchAllItems();
    const result = upsertFromCentralFeed(items);

    run.status = "success";
    run.fetchedItems = items.length;
    run.ingestedRows = result.ingestedRows;
    run.finishedAt = new Date().toISOString();
    await appendIngestionRun(run);
    log("info", "finished government catalog sync", {
      correlationId: context?.correlationId,
      fetchedItems: run.fetchedItems,
      ingestedRows: run.ingestedRows
    });

    return run;
  } catch (error) {
    run.errorMessage = error instanceof Error ? error.message : "Unknown sync error";
    run.finishedAt = new Date().toISOString();
    await appendIngestionRun(run);
    log("error", "government catalog sync failed", {
      correlationId: context?.correlationId,
      errorMessage: run.errorMessage
    });
    throw error;
  }
}
