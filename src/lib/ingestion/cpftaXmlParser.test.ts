import { describe, expect, it, vi, beforeEach } from "vitest";
import zlib from "node:zlib";
import { promisify } from "node:util";
import {
  chainIdToStoreKey,
  storeKeyToNameHe,
  parseCpftaGzipXml,
  getLatestPriceFullUrlFromListingPage,
  getLatestPriceFullUrlFromVictoryApi,
  getLatestPriceFullUrlFromCarrefourPage,
  getLatestPriceFullUrlFromWoltIndex,
} from "./cpftaXmlParser";

const gzip = promisify(zlib.gzip);

// ── chainIdToStoreKey ────────────────────────────────────────────────

describe("chainIdToStoreKey", () => {
  it("maps known chain IDs", () => {
    expect(chainIdToStoreKey("7290027600007")).toBe("shufersal");
    expect(chainIdToStoreKey("7290058140886")).toBe("rami-levy");
    expect(chainIdToStoreKey("7290696200003")).toBe("victory");
    expect(chainIdToStoreKey("7290700100008")).toBe("hazi-hinam");
    expect(chainIdToStoreKey("7290873900009")).toBe("tiv-taam");
    expect(chainIdToStoreKey("7290785400000")).toBe("keshet");
  });

  it("returns the raw chainId for unknown chains", () => {
    expect(chainIdToStoreKey("9999999999999")).toBe("9999999999999");
  });
});

// ── storeKeyToNameHe ─────────────────────────────────────────────────

describe("storeKeyToNameHe", () => {
  it("returns Hebrew names for known store keys", () => {
    expect(storeKeyToNameHe("shufersal")).toBe("שופרסל");
    expect(storeKeyToNameHe("rami-levy")).toBe("רמי לוי");
    expect(storeKeyToNameHe("hazi-hinam")).toBe("חצי חינם");
  });

  it("falls back to the store key for unknown entries", () => {
    expect(storeKeyToNameHe("unknown-chain")).toBe("unknown-chain");
  });
});

// ── parseCpftaGzipXml ────────────────────────────────────────────────

const SAMPLE_XML = `
<Root>
  <ChainId>7290027600007</ChainId>
  <Items>
    <Item>
      <ItemCode>7290000123456</ItemCode>
      <ItemName>חלב 3% תנובה</ItemName>
      <ItemPrice>6.90</ItemPrice>
      <ManufacturerName>תנובה</ManufacturerName>
      <Quantity>1000</Quantity>
    </Item>
    <Item>
      <ItemCode>7290000654321</ItemCode>
      <ItemName>לחם אחיד</ItemName>
      <ItemPrice>5.50</ItemPrice>
    </Item>
    <Item>
      <ItemName>מוצר ללא מחיר</ItemName>
      <ItemPrice>0</ItemPrice>
    </Item>
  </Items>
</Root>`;

describe("parseCpftaGzipXml", () => {
  it("parses raw XML buffer", async () => {
    const buf = Buffer.from(SAMPLE_XML, "utf-8");
    const items = await parseCpftaGzipXml(buf);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      sourceProductName: "חלב 3% תנובה",
      storeId: "shufersal",
      priceAgorot: 690,
      barcode: "7290000123456",
      brand: "תנובה",
      sizeGram: 1000,
    });
    expect(items[1]).toMatchObject({
      sourceProductName: "לחם אחיד",
      priceAgorot: 550,
    });
  });

  it("parses gzip-compressed XML buffer", async () => {
    const compressed = await gzip(Buffer.from(SAMPLE_XML, "utf-8"));
    const items = await parseCpftaGzipXml(compressed);
    expect(items).toHaveLength(2);
    expect(items[0].storeId).toBe("shufersal");
  });

  it("skips items with zero or invalid price", async () => {
    const xml = `<Root><ChainId>7290027600007</ChainId>
      <Item><ItemName>זול</ItemName><ItemPrice>0</ItemPrice></Item>
      <Item><ItemName>שבור</ItemName><ItemPrice>abc</ItemPrice></Item>
    </Root>`;
    const items = await parseCpftaGzipXml(Buffer.from(xml));
    expect(items).toHaveLength(0);
  });

  it("uses raw chainId as storeId when not in map", async () => {
    const xml = `<Root><ChainId>9999999999</ChainId>
      <Item><ItemName>מוצר</ItemName><ItemPrice>10.00</ItemPrice></Item>
    </Root>`;
    const items = await parseCpftaGzipXml(Buffer.from(xml));
    expect(items[0].storeId).toBe("9999999999");
  });
});

// ── getLatestPriceFullUrlFromListingPage ─────────────────────────────

describe("getLatestPriceFullUrlFromListingPage", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  function mockFetch(html: string, ok = true) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok,
      text: () => Promise.resolve(html),
    }));
  }

  it("extracts absolute https PriceFull link", async () => {
    mockFetch(`<a href="https://prices.shufersal.co.il/PriceFull20250101.gz">download</a>`);
    const url = await getLatestPriceFullUrlFromListingPage("https://prices.shufersal.co.il/");
    expect(url).toBe("https://prices.shufersal.co.il/PriceFull20250101.gz");
  });

  it("resolves relative PriceFull link to absolute", async () => {
    mockFetch(`<a href="PriceFull7290058140886-20250101.gz">file</a>`);
    const url = await getLatestPriceFullUrlFromListingPage("https://url.retail.publishedprices.co.il/ramilevy/");
    expect(url).toBe("https://url.retail.publishedprices.co.il/ramilevy/PriceFull7290058140886-20250101.gz");
  });

  it("falls back to any .gz link when no PriceFull found", async () => {
    mockFetch(`<a href="Price7290058140886-20250101.gz">file</a>`);
    const url = await getLatestPriceFullUrlFromListingPage("https://url.retail.publishedprices.co.il/ramilevy/");
    expect(url).toBe("https://url.retail.publishedprices.co.il/ramilevy/Price7290058140886-20250101.gz");
  });

  it("unescapes &amp; in absolute URLs", async () => {
    mockFetch(`<a href="https://prices.example.co.il/file.gz?a=1&amp;b=2">dl</a>`);
    const url = await getLatestPriceFullUrlFromListingPage("https://prices.example.co.il/");
    expect(url).toBe("https://prices.example.co.il/file.gz?a=1&b=2");
  });

  it("returns null when fetch fails", async () => {
    mockFetch("", false);
    expect(await getLatestPriceFullUrlFromListingPage("https://example.com/")).toBeNull();
  });

  it("returns null when no .gz link found", async () => {
    mockFetch("<html>no links here</html>");
    expect(await getLatestPriceFullUrlFromListingPage("https://example.com/")).toBeNull();
  });
});

// ── getLatestPriceFullUrlFromVictoryApi ──────────────────────────────

describe("getLatestPriceFullUrlFromVictoryApi", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  function mockFetch(data: unknown, ok = true) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(data),
    }));
  }

  it("returns the latest PriceFull file URL", async () => {
    mockFetch([
      { name: "PriceFull7290696200003-20250101.gz" },
      { name: "PriceFull7290696200003-20250103.gz" },
      { name: "PriceFull7290696200003-20250102.gz" },
      { name: "Stores7290696200003-20250103.gz" },
    ]);
    const url = await getLatestPriceFullUrlFromVictoryApi("7290696200003");
    expect(url).toBe("https://laibcatalog.co.il/webapi/7290696200003/PriceFull7290696200003-20250103.gz");
  });

  it("falls back to latest Price file when no PriceFull files exist", async () => {
    mockFetch([
      { name: "Price7290696200003-001-20250103.gz" },
      { name: "Price7290696200003-001-20250101.gz" },
      { name: "Stores7290696200003-20250103.gz" },
    ]);
    const url = await getLatestPriceFullUrlFromVictoryApi("7290696200003");
    expect(url).toContain("Price7290696200003-001-20250103.gz");
  });

  it("returns null when no Price files exist at all", async () => {
    mockFetch([{ name: "Stores7290696200003-20250103.gz" }]);
    expect(await getLatestPriceFullUrlFromVictoryApi("7290696200003")).toBeNull();
  });

  it("returns null when fetch fails", async () => {
    mockFetch([], false);
    expect(await getLatestPriceFullUrlFromVictoryApi("7290696200003")).toBeNull();
  });

  it("handles files without name field", async () => {
    mockFetch([{ name: undefined }, { name: "PriceFull7290696200003-20250103.gz" }]);
    const url = await getLatestPriceFullUrlFromVictoryApi("7290696200003");
    expect(url).toContain("PriceFull7290696200003-20250103.gz");
  });
});

// ── getLatestPriceFullUrlFromCarrefourPage ───────────────────────────

describe("getLatestPriceFullUrlFromCarrefourPage", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("extracts file URL from embedded JS variables", async () => {
    const html = `
      const path = '20250103'
      const files = [{"name":"PriceFull7290055700007-20250103.gz","size":1234}]
    `;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(html) }));
    const url = await getLatestPriceFullUrlFromCarrefourPage("https://prices.carrefour.co.il/");
    expect(url).toBe("https://prices.carrefour.co.il/20250103/PriceFull7290055700007-20250103.gz");
  });

  it("returns null when path variable missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve("<html></html>") }));
    expect(await getLatestPriceFullUrlFromCarrefourPage("https://prices.carrefour.co.il/")).toBeNull();
  });
});

// ── getLatestPriceFullUrlFromWoltIndex ───────────────────────────────

describe("getLatestPriceFullUrlFromWoltIndex", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("navigates index → date page → PriceFull file", async () => {
    const indexHtml = `<a href="2025-01-03.html">2025-01-03</a>`;
    const dateHtml = `<a href="download/PriceFull7290058249350-20250103.gz">dl</a>`;
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(indexHtml) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(dateHtml) })
    );
    const url = await getLatestPriceFullUrlFromWoltIndex("https://wm-gateway.wolt.com/isr-prices/public/v1/index.html");
    expect(url).toBe("https://wm-gateway.wolt.com/isr-prices/public/v1/download/PriceFull7290058249350-20250103.gz");
  });

  it("returns null when index page has no date links", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve("<html></html>") }));
    expect(await getLatestPriceFullUrlFromWoltIndex("https://wm-gateway.wolt.com/isr-prices/public/v1/index.html")).toBeNull();
  });
});
