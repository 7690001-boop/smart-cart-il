import { NextResponse } from "next/server";
import { canonicalProducts, storeSkus, stores } from "@/lib/data";

export async function GET() {
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
