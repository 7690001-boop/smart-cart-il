import { GovernmentCatalogItem } from "@/lib/types";

export interface RetailerFeedProvider {
  fetchAllItems(): Promise<GovernmentCatalogItem[]>;
}

type FeedRecord = Record<string, unknown>;

function stringValue(record: FeedRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function numberValue(record: FeedRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    const n = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function normalizeRecord(record: FeedRecord): GovernmentCatalogItem | null {
  const sourceProductName = stringValue(record, ["name", "product_name", "title", "item_name"]);
  const storeId = stringValue(record, ["store_id", "chain_id", "storeCode"]) ?? "s1";
  const price = numberValue(record, ["price", "item_price", "price_ils"]);
  if (!sourceProductName || !price) return null;
  return {
    sourceProductName,
    storeId,
    priceAgorot: Math.round(price * 100),
    brand: stringValue(record, ["brand", "manufacturer"]),
    sizeGram: numberValue(record, ["size_gram", "quantity_gram", "unit_qty"]),
    barcode: stringValue(record, ["barcode", "item_code", "gtin"]),
    imageUrl: stringValue(record, ["image", "image_url", "imageUrl"])
  };
}

export class RetailerJsonFeedProvider implements RetailerFeedProvider {
  constructor(private readonly feedUrls: string[]) {}

  async fetchAllItems() {
    const all: GovernmentCatalogItem[] = [];
    for (const feedUrl of this.feedUrls) {
      const response = await fetch(feedUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Retailer feed request failed (${response.status}) for ${feedUrl}`);
      }
      const payload = (await response.json()) as unknown;
      const records = Array.isArray(payload)
        ? payload
        : typeof payload === "object" && payload && "items" in payload
          ? ((payload as { items?: unknown[] }).items ?? [])
          : [];

      for (const record of records) {
        if (!record || typeof record !== "object") continue;
        const item = normalizeRecord(record as FeedRecord);
        if (item) all.push(item);
      }
    }
    return all;
  }
}

export function getRetailerProviderFromEnv() {
  const raw = process.env.RETAILER_FEED_URLS ?? "";
  const urls = raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (urls.length === 0) {
    throw new Error("Missing RETAILER_FEED_URLS env var");
  }
  return new RetailerJsonFeedProvider(urls);
}
