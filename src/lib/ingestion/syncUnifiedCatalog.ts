import { upsertFromCentralFeed } from "@/lib/ingestion/centralFeed";
import { appendIngestionRun } from "@/lib/ingestion/history";
import { getGovernmentCatalogProviderFromEnv } from "@/lib/ingestion/governmentCatalog";
import { getRetailerProviderFromEnv } from "@/lib/ingestion/retailerFeeds";
import { GovernmentCatalogItem, IngestionRunRecord } from "@/lib/types";
import { log } from "@/lib/observability/logger";

function dedupeItems(items: GovernmentCatalogItem[]) {
  const map = new Map<string, GovernmentCatalogItem>();
  for (const item of items) {
    const key = `${item.storeId}::${item.barcode ?? item.sourceProductName.toLowerCase()}`;
    map.set(key, item);
  }
  return [...map.values()];
}

export async function syncUnifiedCatalog(context?: { correlationId?: string; idempotencyKey?: string }) {
  const run: IngestionRunRecord = {
    id: `ing-unified-${Date.now()}`,
    source: "unified-catalog",
    startedAt: new Date().toISOString(),
    status: "failed",
    fetchedItems: 0,
    ingestedRows: 0,
    correlationId: context?.correlationId,
    idempotencyKey: context?.idempotencyKey
  };

  try {
    const govProvider = getGovernmentCatalogProviderFromEnv();
    const govItems = await govProvider.fetchAllItems();

    let retailerItems: GovernmentCatalogItem[] = [];
    try {
      retailerItems = await getRetailerProviderFromEnv().fetchAllItems();
    } catch {
      retailerItems = [];
    }

    const merged = dedupeItems([...govItems, ...retailerItems]);
    const result = upsertFromCentralFeed(merged);
    run.status = "success";
    run.fetchedItems = merged.length;
    run.ingestedRows = result.ingestedRows;
    run.finishedAt = new Date().toISOString();
    await appendIngestionRun(run);
    log("info", "unified sync success", {
      correlationId: context?.correlationId,
      fetchedItems: run.fetchedItems,
      ingestedRows: run.ingestedRows
    });
    return run;
  } catch (error) {
    run.errorMessage = error instanceof Error ? error.message : "Unified sync failed";
    run.finishedAt = new Date().toISOString();
    await appendIngestionRun(run);
    log("error", "unified sync failed", {
      correlationId: context?.correlationId,
      errorMessage: run.errorMessage
    });
    throw error;
  }
}
