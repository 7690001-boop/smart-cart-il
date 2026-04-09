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
    maxDistanceKm:
      body.data.options?.storePreferences?.maxDistanceKm ?? profile?.maxDistanceKm ?? 15,
    whitelistStoreIds: body.data.options?.storePreferences?.whitelistStoreIds ?? [],
    blacklistStoreIds: [
      ...(body.data.options?.storePreferences?.blacklistStoreIds ?? []),
      ...(profile?.excludedStores ?? [])
    ]
  };
  const effectiveUserLocation =
    body.data.options?.userLocation ??
    (profile?.homeLatitude != null && profile.homeLongitude != null
      ? { latitude: profile.homeLatitude, longitude: profile.homeLongitude }
      : undefined);

  const offers = await prisma.retailOffer.findMany({
    orderBy: { fetchedAt: "desc" },
    take: 20000
  });
  if (offers.length === 0) {
    return NextResponse.json({
      listId: list.id,
      recommended: null,
      runnersUp: [],
      appliedStoreFilters: effectiveFilters,
      note: "No real offers found yet. Run ingestion sync first."
    });
  }

  const sourceNames = await prisma.retailSource.findMany({
    where: { isActive: true },
    select: { sourceKey: true, nameHe: true }
  });
  const sourceNameByKey = new Map(sourceNames.map((s) => [s.sourceKey, s.nameHe]));

  const itemMatches = new Map<string, typeof offers>();
  for (const item of list.items) {
    itemMatches.set(
      item.id,
      offers.filter(
        (o) =>
          o.barcode === item.canonicalProductId || o.normalizedName === item.canonicalProductId
      )
    );
  }

  const allStores = [...new Set(offers.map((o) => o.storeId))];
  const filteredStores = allStores.filter((storeId) => {
    if (effectiveFilters.blacklistStoreIds.includes(storeId)) return false;
    if (
      effectiveFilters.whitelistStoreIds.length > 0 &&
      !effectiveFilters.whitelistStoreIds.includes(storeId)
    ) {
      return false;
    }
    if (effectiveUserLocation) {
      const store = stores.find((s) => s.id === storeId);
      if (!store) return false;
      const dist = distanceKm(effectiveUserLocation, {
        latitude: store.latitude,
        longitude: store.longitude
      });
      if (dist > effectiveFilters.maxDistanceKm) return false;
    }
    return true;
  });

  const ranked = filteredStores
    .map((storeId) => {
      let totalAgorot = 0;
      const chosenItems: Array<{
        itemId: string;
        canonicalProductId: string;
        storeSkuId: string;
        unitPriceAgorot: number;
        quantity: number;
        linePriceAgorot: number;
      }> = [];

      for (const item of list.items) {
        const candidates = (itemMatches.get(item.id) ?? [])
          .filter((o) => o.storeId === storeId)
          .sort((a, b) => a.priceAgorot - b.priceAgorot);
        const chosen = candidates[0];
        if (!chosen) {
          if (!item.replaceable) return null;
          continue;
        }
        const linePriceAgorot = chosen.priceAgorot * item.quantity;
        totalAgorot += linePriceAgorot;
        chosenItems.push({
          itemId: item.id,
          canonicalProductId: item.canonicalProductId,
          storeSkuId: chosen.id,
          unitPriceAgorot: chosen.priceAgorot,
          quantity: item.quantity,
          linePriceAgorot
        });
      }

      const exampleOffer = offers.find((o) => o.storeId === storeId);
      const storeNameHe =
        (exampleOffer ? sourceNameByKey.get(exampleOffer.sourceKey) : undefined) ?? storeId;

      return {
        store: {
          id: storeId,
          nameHe: storeNameHe
        },
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
