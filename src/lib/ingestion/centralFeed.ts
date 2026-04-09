import { findBestCluster } from "@/lib/clustering/matcher";
import { clusterReviewQueue, storeSkus } from "@/lib/data";
import { GovernmentCatalogItem } from "@/lib/types";

export function upsertFromCentralFeed(rows: GovernmentCatalogItem[]) {
  const now = new Date().toISOString();

  for (const row of rows) {
    const match = findBestCluster(row.sourceProductName);
    if (!match || match.confidence < 0.65) {
      continue;
    }

    const existing = storeSkus.find(
      (sku) => sku.storeId === row.storeId && sku.canonicalProductId === match.canonicalProductId
    );

    if (existing) {
      existing.priceAgorot = row.priceAgorot;
      existing.updatedAt = now;
      if (row.brand) existing.brand = row.brand;
      if (row.sizeGram) existing.sizeGram = row.sizeGram;
      if (row.kosherAuthorities) existing.kosherAuthorities = row.kosherAuthorities;
      if (typeof row.premium === "boolean") existing.premium = row.premium;
    } else {
      storeSkus.push({
        id: `sku-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        storeId: row.storeId,
        canonicalProductId: match.canonicalProductId,
        skuName: row.sourceProductName,
        brand: row.brand,
        sizeGram: row.sizeGram ?? 0,
        kosherAuthorities: row.kosherAuthorities ?? [],
        premium: row.premium ?? false,
        priceAgorot: row.priceAgorot,
        updatedAt: now
      });
    }

    if (match.confidence < 0.85) {
      clusterReviewQueue.push({
        id: `cr-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        sourceName: row.sourceProductName,
        candidateCanonicalId: match.canonicalProductId,
        confidence: match.confidence,
        status: "pending"
      });
    }
  }

  return { updatedAt: now, ingestedRows: rows.length };
}
