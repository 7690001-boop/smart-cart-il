import { GovernmentCatalogItem } from "@/lib/types";
import { prisma } from "@/lib/db";
import {
  fetchAndParseCpftaFeed,
  getLatestPriceFullUrlFromListingPage,
  getLatestPriceFullUrlFromCarrefourPage,
  getLatestPriceFullUrlFromWoltIndex,
  getLatestPriceFullUrlFromVictoryApi,
} from "@/lib/ingestion/cpftaXmlParser";

type FeedFormat = "json" | "cpfta-xml-listing" | "carrefour-listing" | "wolt-listing" | "victory-listing";

export type OfficialRetailSource = {
  id: string;
  nameHe: string;
  nameEn: string;
  storeId: string;
  feedUrl?: string;
  format: FeedFormat;
  credentials?: { username: string; password: string };
};

const defaultOfficialSources: OfficialRetailSource[] = [
  {
    id: "shufersal",
    nameHe: "שופרסל",
    nameEn: "Shufersal",
    storeId: "shufersal",
    feedUrl: "https://prices.shufersal.co.il/FileObject/UpdateCategory?catID=2&storeId=0&sort=Time&sortdir=DESC",
    format: "cpfta-xml-listing"
  },
  {
    id: "rami-levy",
    nameHe: "רמי לוי",
    nameEn: "Rami Levy",
    storeId: "rami-levy",
    feedUrl: "https://url.retail.publishedprices.co.il/ramilevy/",
    format: "cpfta-xml-listing"
  },
  {
    id: "victory",
    nameHe: "ויקטורי",
    nameEn: "Victory",
    storeId: "victory",
    feedUrl: "7290696200003",
    format: "victory-listing"
  },
  {
    id: "mega",
    nameHe: "מגה",
    nameEn: "Mega",
    storeId: "mega",
    feedUrl: "https://prices.mega.co.il/",
    format: "carrefour-listing"
  },
  {
    id: "yochananof",
    nameHe: "יוחננוף",
    nameEn: "Yochananof",
    storeId: "yochananof",
    feedUrl: "https://url.retail.publishedprices.co.il/yohananof/",
    format: "cpfta-xml-listing"
  },
  {
    id: "osher-ad",
    nameHe: "אושר עד",
    nameEn: "Osher Ad",
    storeId: "osher-ad",
    feedUrl: "https://url.retail.publishedprices.co.il/osherad/",
    format: "cpfta-xml-listing"
  },
  {
    id: "hazi-hinam",
    nameHe: "חצי חינם",
    nameEn: "Hazi Hinam",
    storeId: "hazi-hinam",
    feedUrl: "https://url.retail.publishedprices.co.il/HaziHinam/",
    format: "cpfta-xml-listing"
  },
  {
    id: "tiv-taam",
    nameHe: "טיב טעם",
    nameEn: "Tiv Taam",
    storeId: "tiv-taam",
    feedUrl: "https://url.retail.publishedprices.co.il/TivTaam/",
    format: "cpfta-xml-listing"
  },
  {
    id: "dor-alon",
    nameHe: "דור אלון",
    nameEn: "Dor Alon",
    storeId: "dor-alon",
    feedUrl: "https://url.retail.publishedprices.co.il/doralon/",
    format: "cpfta-xml-listing"
  },
  {
    id: "keshet",
    nameHe: "קשת טעמים",
    nameEn: "Keshet",
    storeId: "keshet",
    feedUrl: "https://url.retail.publishedprices.co.il/Keshet/",
    format: "cpfta-xml-listing"
  },
  {
    id: "super-pharm",
    nameHe: "סופר-פארם",
    nameEn: "Super Pharm",
    storeId: "super-pharm",
    feedUrl: "https://prices.super-pharm.co.il/",
    format: "cpfta-xml-listing"
  },
  {
    id: "carrefour",
    nameHe: "קרפור",
    nameEn: "Carrefour",
    storeId: "carrefour",
    feedUrl: "https://prices.carrefour.co.il/",
    format: "carrefour-listing"
  },
  {
    id: "wolt",
    nameHe: "וולט",
    nameEn: "Wolt",
    storeId: "wolt",
    feedUrl: "https://wm-gateway.wolt.com/isr-prices/public/v1/index.html",
    format: "wolt-listing"
  }
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
      format: (
        s.authHint === "cpfta-xml-listing" ? "cpfta-xml-listing" :
        s.authHint === "carrefour-listing" ? "carrefour-listing" :
        s.authHint === "wolt-listing" ? "wolt-listing" :
        s.authHint === "victory-listing" ? "victory-listing" :
        "json"
      ) as FeedFormat,
      credentials: s.loginUsername && s.loginPassword
        ? { username: s.loginUsername, password: s.loginPassword }
        : undefined
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
      format: (
        s.authHint === "cpfta-xml-listing" ? "cpfta-xml-listing" :
        s.authHint === "carrefour-listing" ? "carrefour-listing" :
        s.authHint === "wolt-listing" ? "wolt-listing" :
        s.authHint === "victory-listing" ? "victory-listing" :
        "json"
      ) as FeedFormat,
      credentials: s.loginUsername && s.loginPassword
        ? { username: s.loginUsername, password: s.loginPassword }
        : undefined
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
  const creds = source.credentials;

  if (source.format === "cpfta-xml-listing") {
    const fileUrl = await getLatestPriceFullUrlFromListingPage(source.feedUrl, creds);
    if (!fileUrl) throw new Error(`No CPFTA file found at listing page for ${source.nameEn}`);
    return fetchAndParseCpftaFeed(fileUrl, creds);
  }

  if (source.format === "carrefour-listing") {
    const fileUrl = await getLatestPriceFullUrlFromCarrefourPage(source.feedUrl);
    if (!fileUrl) throw new Error(`No Carrefour file found for ${source.nameEn}`);
    return fetchAndParseCpftaFeed(fileUrl, creds);
  }

  if (source.format === "wolt-listing") {
    const fileUrl = await getLatestPriceFullUrlFromWoltIndex(source.feedUrl);
    if (!fileUrl) throw new Error(`No Wolt file found for ${source.nameEn}`);
    return fetchAndParseCpftaFeed(fileUrl, creds);
  }

  if (source.format === "victory-listing") {
    const fileUrl = await getLatestPriceFullUrlFromVictoryApi(source.feedUrl);
    if (!fileUrl) throw new Error(`No Victory file found for chain ${source.feedUrl}`);
    return fetchAndParseCpftaFeed(fileUrl, creds);
  }

  const authHeader: Record<string, string> = creds
    ? { Authorization: `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString("base64")}` }
    : {};
  const response = await fetch(source.feedUrl, { headers: authHeader, cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Official source failed (${response.status}) for ${source.nameEn}`);
  }
  if (source.format === "json") {
    const payload = (await response.json()) as unknown;
    return parseJsonFeed(payload, source.storeId);
  }
  return [];
}
