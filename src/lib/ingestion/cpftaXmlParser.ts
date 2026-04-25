import zlib from "node:zlib";
import { promisify } from "node:util";
import { GovernmentCatalogItem } from "@/lib/types";

const gunzip = promisify(zlib.gunzip);

// Known chain ID → store key mapping
const CHAIN_ID_MAP: Record<string, string> = {
  "7290027600007": "shufersal",
  "7290058140886": "rami-levy",
  "7290696200003": "victory",
  "7290058137834": "mega",
  "7290055700219": "yochananof",
  "7290492000005": "osher-ad",
  "7290633800006": "dor-alon",
  "7290876100000": "super-pharm",
  "7290055700007": "carrefour",
  "7290058249350": "wolt",
  "7290700100008": "hazi-hinam",
  "7290873900009": "tiv-taam",
  "7290785400000": "keshet",
};

// Chain ID → Hebrew name
const CHAIN_NAME_HE: Record<string, string> = {
  shufersal: "שופרסל",
  "rami-levy": "רמי לוי",
  victory: "ויקטורי",
  mega: "מגה",
  yochananof: "יוחננוף",
  "osher-ad": "אושר עד",
  "dor-alon": "דור אלון",
  "super-pharm": "סופר-פארם",
  carrefour: "קרפור",
  wolt: "וולט",
  "hazi-hinam": "חצי חינם",
  "tiv-taam": "טיב טעם",
  keshet: "קשת טעמים",
};

export function chainIdToStoreKey(chainId: string): string {
  return CHAIN_ID_MAP[chainId] ?? chainId;
}

export function storeKeyToNameHe(storeKey: string): string {
  return CHAIN_NAME_HE[storeKey] ?? storeKey;
}

function extractText(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() || undefined;
}

function parseItems(xmlContent: string, chainId: string): GovernmentCatalogItem[] {
  const storeId = chainIdToStoreKey(chainId);
  const itemBlocks = xmlContent.match(/<Item>([\s\S]*?)<\/Item>/g) ?? [];

  return itemBlocks.flatMap((block) => {
    const itemName = extractText(block, "ItemName");
    const itemPriceStr = extractText(block, "ItemPrice");
    if (!itemName || !itemPriceStr) return [];

    const itemPrice = parseFloat(itemPriceStr);
    if (isNaN(itemPrice) || itemPrice <= 0) return [];

    const quantityStr = extractText(block, "Quantity");
    const quantity = quantityStr ? parseFloat(quantityStr) : undefined;

    return [
      {
        sourceProductName: itemName,
        storeId,
        priceAgorot: Math.round(itemPrice * 100),
        brand: extractText(block, "ManufacturerName") ?? extractText(block, "ManufactureName"),
        sizeGram: quantity && !isNaN(quantity) ? Math.round(quantity) : undefined,
        barcode: extractText(block, "ItemCode"),
        imageUrl: undefined
      }
    ];
  });
}

export async function parseCpftaGzipXml(buffer: Buffer): Promise<GovernmentCatalogItem[]> {
  let xmlContent: string;
  try {
    const decompressed = await gunzip(buffer);
    xmlContent = decompressed.toString("utf-8");
  } catch {
    // Not gzip — try treating as raw XML
    xmlContent = buffer.toString("utf-8");
  }

  const chainId = extractText(xmlContent, "ChainId") ?? "unknown";
  return parseItems(xmlContent, chainId);
}

type Credentials = { username: string; password: string };

function basicAuthHeader(creds?: Credentials): Record<string, string> {
  if (!creds) return {};
  return { Authorization: `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString("base64")}` };
}

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Fetch a CPFTA listing page and extract the most recent PriceFull .gz file URL.
 *  Supports both absolute and relative hrefs (url.retail.publishedprices.co.il uses relative).
 *  publishedprices.co.il requires X-Requested-With; other sites need a browser User-Agent. */
export async function getLatestPriceFullUrlFromListingPage(listingPageUrl: string, credentials?: Credentials): Promise<string | null> {
  const needsXhr = listingPageUrl.includes("publishedprices.co.il");
  const res = await fetch(listingPageUrl, {
    headers: {
      "User-Agent": BROWSER_UA,
      ...(needsXhr ? { "X-Requested-With": "XMLHttpRequest" } : {}),
      ...basicAuthHeader(credentials)
    },
    cache: "no-store"
  });
  if (!res.ok) return null;

  const html = await res.text();

  // Prefer PriceFull files; fall back to any .gz
  const match =
    html.match(/href=['"]?([^'">\s]*PriceFull[^'">\s]*\.gz[^'">\s]*)/i) ??
    html.match(/href=['"]?([^'">\s]+\.gz[^'">\s]*)/i);
  if (!match) return null;

  const href = match[1].replace(/&amp;/g, "&");
  if (href.startsWith("http")) return href;
  return new URL(href, listingPageUrl).toString();
}

/** Fetch the Victory (laibcatalog) file list API and return the latest price file URL.
 *  laibcatalog uses Price{chainId}-{branch}-{date}.gz naming (no "PriceFull" prefix). */
export async function getLatestPriceFullUrlFromVictoryApi(chainId: string): Promise<string | null> {
  const res = await fetch(
    `https://laibcatalog.co.il/webapi/api/getfiles?edi=${chainId}`,
    { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" }
  );
  if (!res.ok) return null;

  const files = (await res.json()) as Array<{ name?: string; fileDate?: string }>;

  // Prefer latest PriceFull if available; fall back to most recent non-promo Price file
  const priceFiles = files
    .map((f) => f.name ?? "")
    .filter((n) => /^Price/i.test(n) && !/promo/i.test(n) && n.endsWith(".gz"));

  const priceFullFiles = priceFiles.filter((n) => /PriceFull/i.test(n));
  const latest = (priceFullFiles.length > 0 ? priceFullFiles : priceFiles).sort().at(-1);

  if (!latest) return null;
  return `https://laibcatalog.co.il/webapi/${chainId}/${latest}`;
}

/** Fetch a CPFTA gzip+XML price file and parse it. */
export async function fetchAndParseCpftaFeed(fileUrl: string, credentials?: Credentials): Promise<GovernmentCatalogItem[]> {
  const res = await fetch(fileUrl, {
    headers: { "User-Agent": BROWSER_UA, ...basicAuthHeader(credentials) },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`CPFTA feed fetch failed (${res.status}): ${fileUrl}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  return parseCpftaGzipXml(buffer);
}

/** Fetch the Carrefour listing page and extract the most recent PriceFull file URL.
 *  The page embeds a JS files array: {"name":"PriceFull...", ...} and a path variable. */
export async function getLatestPriceFullUrlFromCarrefourPage(listingPageUrl: string): Promise<string | null> {
  const res = await fetch(listingPageUrl, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" });
  if (!res.ok) return null;

  const html = await res.text();

  const pathMatch = html.match(/const path = '(\d{8})'/);
  if (!pathMatch) return null;
  const datePath = pathMatch[1];

  const fileMatch = html.match(/"name":"(PriceFull[^"]+\.gz)"/);
  if (!fileMatch) return null;

  const baseUrl = new URL(listingPageUrl).origin;
  return `${baseUrl}/${datePath}/${fileMatch[1]}`;
}

/** Fetch the Wolt index page → latest date page → first PriceFull file URL.
 *  Index lists date HTML files; each date page lists download hrefs. */
export async function getLatestPriceFullUrlFromWoltIndex(indexUrl: string): Promise<string | null> {
  const indexRes = await fetch(indexUrl, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" });
  if (!indexRes.ok) return null;

  const indexHtml = await indexRes.text();
  const dateMatch = indexHtml.match(/href="(\d{4}-\d{2}-\d{2})\.html"/);
  if (!dateMatch) return null;
  const latestDate = dateMatch[1];

  const baseUrl = indexUrl.replace("/index.html", "");
  const datePageRes = await fetch(`${baseUrl}/${latestDate}.html`, { headers: { "User-Agent": BROWSER_UA }, cache: "no-store" });
  if (!datePageRes.ok) return null;

  const dateHtml = await datePageRes.text();
  const fileMatch = dateHtml.match(/href="(download\/[^"]*PriceFull[^"]+\.gz)"/);
  if (!fileMatch) return null;

  return `${baseUrl}/${fileMatch[1]}`;
}
