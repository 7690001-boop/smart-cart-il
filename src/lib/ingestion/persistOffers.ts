import { prisma } from "@/lib/db";
import { GovernmentCatalogItem } from "@/lib/types";

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9֐-׿]+/g, " ").trim();
}

export async function persistRetailOffers(items: GovernmentCatalogItem[], sourceKey = "unknown") {
  if (items.length === 0) return { saved: 0 };

  const storeId = items[0]?.storeId ?? sourceKey;
  const chain = await prisma.chain.upsert({
    where: { chainId: storeId },
    update: {},
    create: { chainId: storeId, nameHe: storeId }
  });

  let saved = 0;
  for (const item of items) {
    const normalizedName = normalizeName(item.sourceProductName);
    let product;

    if (item.barcode) {
      product = await prisma.product.upsert({
        where: { barcode: item.barcode },
        update: {
          nameHe: item.sourceProductName,
          brand: item.brand ?? null,
          imageUrl: item.imageUrl ?? null
        },
        create: {
          barcode: item.barcode,
          normalizedName,
          nameHe: item.sourceProductName,
          brand: item.brand ?? null,
          imageUrl: item.imageUrl ?? null
        }
      });
    } else {
      product = await prisma.product.findFirst({ where: { normalizedName } });
      if (!product) {
        product = await prisma.product.create({
          data: {
            normalizedName,
            nameHe: item.sourceProductName,
            brand: item.brand ?? null,
            imageUrl: item.imageUrl ?? null
          }
        });
      }
    }

    await prisma.price.upsert({
      where: { chainId_productId: { chainId: chain.id, productId: product.id } },
      update: { priceAgorot: item.priceAgorot, fetchedAt: new Date() },
      create: { chainId: chain.id, productId: product.id, priceAgorot: item.priceAgorot }
    });
    saved++;
  }

  return { saved };
}
