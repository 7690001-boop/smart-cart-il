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
  const products = await prisma.product.findMany({
    include: {
      prices: {
        include: { chain: true },
        orderBy: { priceAgorot: "asc" }
      }
    },
    take: 5000
  });

  if (products.length > 0) {
    const result = products.map((product) => {
      const cheapest = product.prices[0] ?? null;
      return {
        id: product.barcode ?? product.normalizedName,
        name: product.nameHe,
        nameHe: product.nameHe,
        category: product.category ?? "General",
        categoryHe: translateCategoryHe(product.category),
        brand: product.brand ?? undefined,
        brandHe: translateBrandHe(product.brand),
        defaultSizeGram: 0,
        cheapestPriceAgorot: cheapest?.priceAgorot ?? null,
        cheapestStoreNameHe: cheapest?.chain.nameHe ?? null,
        offersCount: product.prices.length
      };
    });
    return NextResponse.json(result);
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
