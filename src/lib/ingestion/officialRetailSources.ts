import { GovernmentCatalogItem } from "@/lib/types";
import { prisma } from "@/lib/db";

type FeedFormat = "json";

export type OfficialRetailSource = {
  id: string;
  nameHe: string;
  nameEn: string;
  storeId: string;
  feedUrl?: string;
  format: FeedFormat;
};

const defaultOfficialSources: OfficialRetailSource[] = [
  { id: "shufersal", nameHe: "שופרסל", nameEn: "Shufersal", storeId: "s1", format: "json" },
  { id: "rami-levy", nameHe: "רמי לוי", nameEn: "Rami Levy", storeId: "s2", format: "json" },
  { id: "victory", nameHe: "ויקטורי", nameEn: "Victory", storeId: "s3", format: "json" }
];

type FeedRecord = Record<string, unknown>;

function valueAsString(record: FeedRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

function valueAsNumber(record: FeedRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) return numeric;
  }
  return undefined;
}

function parseJsonFeed(payload: unknown, storeId: string) {
  const rows = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload && "items" in payload
      ? ((payload as { items?: unknown[] }).items ?? [])
      : [];

  const mapped: GovernmentCatalogItem[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const record = row as FeedRecord;
    const sourceProductName = valueAsString(record, ["name", "product_name", "item_name", "title"]);
    const price = valueAsNumber(record, ["price", "item_price", "price_ils"]);
    if (!sourceProductName || !price) continue;
    mapped.push({
      sourceProductName,
      storeId,
      priceAgorot: Math.round(price * 100),
      brand: valueAsString(record, ["brand", "manufacturer"]),
      sizeGram: valueAsNumber(record, ["size_gram", "unit_qty", "quantity"]),
      barcode: valueAsString(record, ["barcode", "item_code", "gtin"]),
      imageUrl: valueAsString(record, ["image", "image_url", "imageUrl"])
    });
  }
  return mapped;
}

export async function getOfficialRetailSources() {
  const dbSources = await prisma.retailSource.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" }
  });
  if (dbSources.length > 0) {
    return dbSources.map((s) => ({
      id: s.sourceKey,
      nameHe: s.nameHe,
      nameEn: s.nameEn ?? s.nameHe,
      storeId: s.storeId,
      feedUrl: s.feedUrl,
      format: "json" as const
    }));
  }

  const overridesRaw = process.env.OFFICIAL_RETAIL_SOURCES_JSON;
  if (!overridesRaw) return defaultOfficialSources;

  try {
    const parsed = JSON.parse(overridesRaw) as OfficialRetailSource[];
    return parsed.length > 0 ? parsed : defaultOfficialSources;
  } catch {
    return defaultOfficialSources;
  }
}

export async function getDueOfficialRetailSources(now = new Date()) {
  const active = await prisma.retailSource.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" }
  });
  return active
    .filter((s) => {
      if (!s.lastCatalogSyncAt) return true;
      const nextTs = s.lastCatalogSyncAt.getTime() + s.syncCadenceMinutes * 60_000;
      return nextTs <= now.getTime();
    })
    .map((s) => ({
      id: s.sourceKey,
      nameHe: s.nameHe,
      nameEn: s.nameEn ?? s.nameHe,
      storeId: s.storeId,
      feedUrl: s.feedUrl,
      format: "json" as const
    }));
}

export async function updateRetailSourceCatalogSyncStatus(params: {
  sourceKey: string;
  status: "success" | "failed";
  errorMessage?: string;
}) {
  await prisma.retailSource.update({
    where: { sourceKey: params.sourceKey },
    data: {
      lastCatalogSyncAt: new Date(),
      lastCatalogStatus: params.status,
      lastCatalogError: params.errorMessage ?? null
    }
  });
}

export async function fetchOfficialSourceItems(source: OfficialRetailSource) {
  if (!source.feedUrl) return [];
  const response = await fetch(source.feedUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Official source failed (${response.status}) for ${source.nameEn}`);
  }
  if (source.format === "json") {
    const payload = (await response.json()) as unknown;
    return parseJsonFeed(payload, source.storeId);
  }
  return [];
}
