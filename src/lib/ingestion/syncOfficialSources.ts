import { upsertFromCentralFeed } from "@/lib/ingestion/centralFeed";
import { appendIngestionRun } from "@/lib/ingestion/history";
import {
  fetchOfficialSourceItems,
  getDueOfficialRetailSources,
  getOfficialRetailSources,
  updateRetailSourceCatalogSyncStatus
} from "@/lib/ingestion/officialRetailSources";
import { GovernmentCatalogItem, IngestionRunRecord } from "@/lib/types";
import { log } from "@/lib/observability/logger";
import { persistRetailOffers } from "@/lib/ingestion/persistOffers";

function dedupeItems(items: GovernmentCatalogItem[]) {
  const map = new Map<string, GovernmentCatalogItem>();
  for (const item of items) {
    const key = `${item.storeId}::${item.barcode ?? item.sourceProductName.toLowerCase()}`;
    map.set(key, item);
  }
  return [...map.values()];
}

export async function syncSingleRetailSource(sourceKey: string) {
  const sources = await getOfficialRetailSources();
  const source = sources.find((s) => s.id === sourceKey);
  if (!source) throw new Error(`Retail source not found: ${sourceKey}`);

  try {
    const items = await fetchOfficialSourceItems(source);
    await persistRetailOffers(items, source.id);
    await updateRetailSourceCatalogSyncStatus({ sourceKey, status: "success" });
    return { sourceKey, fetchedItems: items.length, status: "success" as const };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "sync failed";
    await updateRetailSourceCatalogSyncStatus({ sourceKey, status: "failed", errorMessage });
    return { sourceKey, fetchedItems: 0, status: "failed" as const, errorMessage };
  }
}

export async function syncOfficialRetailSources(context?: {
  correlationId?: string;
  idempotencyKey?: string;
  onlyDue?: boolean;
}) {
  const run: IngestionRunRecord = {
    id: `ing-official-${Date.now()}`,
    source: "retailer-web-feeds",
    startedAt: new Date().toISOString(),
    status: "failed",
    fetchedItems: 0,
    ingestedRows: 0,
    sourceDetails: [],
    correlationId: context?.correlationId,
    idempotencyKey: context?.idempotencyKey
  };

  try {
    const sources = context?.onlyDue
      ? await getDueOfficialRetailSources()
      : await getOfficialRetailSources();
    const allItems: GovernmentCatalogItem[] = [];

    for (const source of sources) {
      try {
        const items = await fetchOfficialSourceItems(source);
        allItems.push(...items);
        await persistRetailOffers(items, source.id);
        await updateRetailSourceCatalogSyncStatus({
          sourceKey: source.id,
          status: "success"
        });
        run.sourceDetails?.push({
          sourceName: source.nameHe,
          fetchedItems: items.length,
          status: "success"
        });
      } catch (error) {
        await updateRetailSourceCatalogSyncStatus({
          sourceKey: source.id,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "source sync failed"
        });
        run.sourceDetails?.push({
          sourceName: source.nameHe,
          fetchedItems: 0,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "source sync failed"
        });
      }
    }

    const deduped = dedupeItems(allItems);
    const result = upsertFromCentralFeed(deduped);
    run.status = "success";
    run.fetchedItems = deduped.length;
    run.ingestedRows = result.ingestedRows;
    run.finishedAt = new Date().toISOString();
    await appendIngestionRun(run);
    log("info", "official sources sync success", {
      correlationId: context?.correlationId,
      fetchedItems: run.fetchedItems,
      ingestedRows: run.ingestedRows
    });
    return run;
  } catch (error) {
    run.errorMessage = error instanceof Error ? error.message : "Official sources sync failed";
    run.finishedAt = new Date().toISOString();
    await appendIngestionRun(run);
    log("error", "official sources sync failed", {
      correlationId: context?.correlationId,
      errorMessage: run.errorMessage
    });
    throw error;
  }
}
