import { prisma } from "@/lib/db";
import { GovernmentCatalogItem } from "@/lib/types";

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g, " ").trim();
}

export async function persistRetailOffers(items: GovernmentCatalogItem[], sourceKey = "unknown") {
  if (items.length === 0) return { saved: 0 };

  // Keep recent dataset bounded to avoid unbounded growth on free plans.
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
  await prisma.retailOffer.deleteMany({
    where: {
      sourceKey,
      fetchedAt: { lt: cutoff }
    }
  });

  await prisma.retailOffer.createMany({
    data: items.map((item) => ({
      sourceKey,
      storeId: item.storeId,
      productName: item.sourceProductName,
      normalizedName: normalizeName(item.sourceProductName),
      category: undefined,
      brand: item.brand,
      barcode: item.barcode,
      imageUrl: item.imageUrl,
      priceAgorot: item.priceAgorot
    })),
    skipDuplicates: false
  });

  return { saved: items.length };
}
