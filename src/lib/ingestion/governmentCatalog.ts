import { GovernmentCatalogItem } from "@/lib/types";

export interface GovernmentCatalogProvider {
  fetchAllItems(): Promise<GovernmentCatalogItem[]>;
}

type DataGovRecord = Record<string, unknown>;
type DataGovResponse = {
  success?: boolean;
  result?: {
    records?: DataGovRecord[];
    total?: number;
  };
};

function valueAsString(record: DataGovRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

function valueAsNumber(record: DataGovRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) return numeric;
  }
  return undefined;
}

function toGovernmentCatalogItem(record: DataGovRecord): GovernmentCatalogItem | null {
  const sourceProductName = valueAsString(record, ["item_name", "name", "product_name", "ItemName"]);
  const storeId = valueAsString(record, ["chain_id", "store_id", "StoreId", "chainid"]) ?? "s1";
  const rawPrice = valueAsNumber(record, ["item_price", "price", "ItemPrice"]);

  if (!sourceProductName || !rawPrice) return null;

  return {
    sourceProductName,
    storeId,
    priceAgorot: Math.round(rawPrice * 100),
    brand: valueAsString(record, ["manufacturer_name", "brand", "ItemManufacturerName"]),
    sizeGram: valueAsNumber(record, ["unit_qty", "size_gram", "Quantity"]),
    barcode: valueAsString(record, ["item_code", "barcode", "ItemCode"]),
    imageUrl: valueAsString(record, ["image_url", "image", "ItemImage"])
  };
}

export class DataGovCatalogProvider implements GovernmentCatalogProvider {
  constructor(
    private readonly resourceId: string,
    private readonly baseUrl: string,
    private readonly apiKey?: string
  ) {}

  async fetchAllItems() {
    const pageSize = 1000;
    let offset = 0;
    let total = Number.POSITIVE_INFINITY;
    const all: GovernmentCatalogItem[] = [];

    while (offset < total) {
      const url = new URL("/api/3/action/datastore_search", this.baseUrl);
      url.searchParams.set("resource_id", this.resourceId);
      url.searchParams.set("limit", String(pageSize));
      url.searchParams.set("offset", String(offset));

      const response = await fetch(url, {
        headers: this.apiKey ? { Authorization: this.apiKey } : undefined,
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error(`Government API request failed: ${response.status}`);
      }

      const payload = (await response.json()) as DataGovResponse;
      const records = payload.result?.records ?? [];
      total = payload.result?.total ?? records.length;

      for (const record of records) {
        const normalized = toGovernmentCatalogItem(record);
        if (normalized) all.push(normalized);
      }

      if (records.length === 0) break;
      offset += pageSize;
    }

    return all;
  }
}

export function getGovernmentCatalogProviderFromEnv() {
  const baseUrl = process.env.GOV_CATALOG_BASE_URL ?? "https://data.gov.il";
  const resourceId = process.env.GOV_CATALOG_RESOURCE_ID;
  const apiKey = process.env.GOV_CATALOG_API_KEY;
  if (!resourceId) {
    throw new Error("Missing GOV_CATALOG_RESOURCE_ID env var");
  }
  return new DataGovCatalogProvider(resourceId, baseUrl, apiKey);
}
