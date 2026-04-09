import { NextResponse } from "next/server";
import { canonicalProducts, storeSkus, stores } from "@/lib/data";
import { prisma } from "@/lib/db";

function translateCategoryHe(category?: string | null) {
  const value = (category ?? "").toLowerCase();
  if (value.includes("dairy")) return "מוצרי חלב";
  if (value.includes("egg")) return "ביצים";
  if (value.includes("bakery") || value.includes("bread")) return "מאפייה";
  if (!category) return "לא מסווג";
  return category;
}

function translateBrandHe(brand?: string | null) {
  const value = (brand ?? "").toLowerCase();
  if (value.includes("tnuva")) return "תנובה";
  if (value.includes("tara")) return "טרה";
  if (value.includes("angel")) return "אנג'ל";
  if (value.includes("galili")) return "גלילי";
  if (!brand) return undefined;
  return brand;
}

export async function GET() {
  const offers = await prisma.retailOffer.findMany({
    orderBy: { fetchedAt: "desc" },
    take: 5000
  });

  if (offers.length > 0) {
    const grouped = new Map<
      string,
      {
        id: string;
        name: string;
        nameHe: string;
        category: string;
        categoryHe: string;
        brand?: string;
        brandHe?: string;
        defaultSizeGram: number;
        cheapestPriceAgorot: number | null;
        cheapestStoreNameHe: string | null;
        offersCount: number;
      }
    >();

    for (const offer of offers) {
      const key = offer.barcode ?? offer.normalizedName;
      const existing = grouped.get(key);
      const currentPrice = offer.priceAgorot;
      const store = stores.find((s) => s.id === offer.storeId);
      if (!existing) {
        grouped.set(key, {
          id: key,
          name: offer.productName,
          nameHe: offer.productName,
          category: offer.category ?? "General",
          categoryHe: translateCategoryHe(offer.category),
          brand: offer.brand ?? undefined,
          brandHe: translateBrandHe(offer.brand),
          defaultSizeGram: 0,
          cheapestPriceAgorot: currentPrice,
          cheapestStoreNameHe: store?.nameHe ?? null,
          offersCount: 1
        });
      } else {
        existing.offersCount += 1;
        if ((existing.cheapestPriceAgorot ?? Number.POSITIVE_INFINITY) > currentPrice) {
          existing.cheapestPriceAgorot = currentPrice;
          existing.cheapestStoreNameHe = store?.nameHe ?? null;
        }
      }
    }
    return NextResponse.json([...grouped.values()]);
  }

  const enriched = canonicalProducts.map((product) => {
    const prices = storeSkus
      .filter((sku) => sku.canonicalProductId === product.id)
      .sort((a, b) => a.priceAgorot - b.priceAgorot);
    const cheapest = prices[0];
    const cheapestStore = cheapest ? stores.find((s) => s.id === cheapest.storeId) : null;
    return {
      ...product,
      cheapestPriceAgorot: cheapest?.priceAgorot ?? null,
      cheapestStoreNameHe: cheapestStore?.nameHe ?? null,
      offersCount: prices.length
    };
  });
  return NextResponse.json(enriched);
}
