import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRequest } from "@/lib/rateLimit";
import { requireDbUser } from "@/lib/sessionUser";
import { prisma } from "@/lib/db";
import { stores } from "@/lib/data";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

const bodySchema = z.object({
  listId: z.string().min(1),
  options: z
    .object({
      userLocation: z
        .object({
          latitude: z.number(),
          longitude: z.number()
        })
        .optional(),
      storePreferences: z
        .object({
          maxDistanceKm: z.number().min(0),
          whitelistStoreIds: z.array(z.string()),
          blacklistStoreIds: z.array(z.string())
        })
        .optional()
    })
    .optional()
});

export async function POST(request: Request) {
  if (!allowRequest("optimize", 90, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const user = await requireDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const list = await prisma.shoppingList.findFirst({
    where: { id: body.data.listId, userId: user.id },
    include: { items: true }
  });
  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

  const profile = await prisma.userPreferenceProfile.findUnique({
    where: { userId: user.id }
  });

  const effectiveFilters = {
    maxDistanceKm: body.data.options?.storePreferences?.maxDistanceKm ?? 15,
    whitelistChainIds: body.data.options?.storePreferences?.whitelistStoreIds ?? [],
    blacklistChainIds: [
      ...(body.data.options?.storePreferences?.blacklistStoreIds ?? []),
      ...(profile?.excludedChains ?? [])
    ]
  };
  const effectiveUserLocation = body.data.options?.userLocation;

  const productIds = list.items.map((item) => item.productId);
  const prices = await prisma.price.findMany({
    where: { productId: { in: productIds } },
    include: { chain: true }
  });

  if (prices.length === 0) {
    return NextResponse.json({
      listId: list.id,
      recommended: null,
      runnersUp: [],
      appliedStoreFilters: effectiveFilters,
      note: "No real offers found yet. Run ingestion sync first."
    });
  }

  const allChainIds = [...new Set(prices.map((p) => p.chainId))];
  const filteredChainIds = allChainIds.filter((chainId) => {
    if (effectiveFilters.blacklistChainIds.includes(chainId)) return false;
    if (
      effectiveFilters.whitelistChainIds.length > 0 &&
      !effectiveFilters.whitelistChainIds.includes(chainId)
    ) {
      return false;
    }
    if (effectiveUserLocation) {
      const store = stores.find((s) => s.id === chainId);
      if (!store) return false;
      const dist = distanceKm(effectiveUserLocation, {
        latitude: store.latitude,
        longitude: store.longitude
      });
      if (dist > effectiveFilters.maxDistanceKm) return false;
    }
    return true;
  });

  const ranked = filteredChainIds
    .map((chainId) => {
      let totalAgorot = 0;
      const chosenItems: Array<{
        itemId: string;
        productId: string;
        chainId: string;
        unitPriceAgorot: number;
        quantity: number;
        linePriceAgorot: number;
      }> = [];

      for (const item of list.items) {
        const candidates = prices
          .filter((p) => p.productId === item.productId && p.chainId === chainId)
          .sort((a, b) => a.priceAgorot - b.priceAgorot);
        const chosen = candidates[0];
        if (!chosen) return null;
        const linePriceAgorot = chosen.priceAgorot * item.quantity;
        totalAgorot += linePriceAgorot;
        chosenItems.push({
          itemId: item.id,
          productId: item.productId,
          chainId: chosen.chainId,
          unitPriceAgorot: chosen.priceAgorot,
          quantity: item.quantity,
          linePriceAgorot
        });
      }

      const chain = prices.find((p) => p.chainId === chainId)?.chain;
      return {
        store: { id: chainId, nameHe: chain?.nameHe ?? chainId },
        totalAgorot,
        items: chosenItems
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => a.totalAgorot - b.totalAgorot);

  return NextResponse.json({
    listId: list.id,
    recommended: ranked[0] ?? null,
    runnersUp: ranked.slice(1, 3),
    appliedStoreFilters: effectiveFilters
  });
}
