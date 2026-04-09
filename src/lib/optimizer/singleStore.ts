import {
  canonicalProducts,
  shoppingLists,
  storeSkus,
  stores,
  userStoreFilterPreferences
} from "@/lib/data";
import { PreferenceRules, ShoppingListItem, StoreSku, UserStoreFilterPreferences } from "@/lib/types";

type Location = {
  latitude: number;
  longitude: number;
};

type OptimizationOptions = {
  userLocation?: Location;
  storePreferences?: UserStoreFilterPreferences;
};

function matchesPreferences(item: ShoppingListItem, sku: StoreSku) {
  const canonical = canonicalProducts.find((cp) => cp.id === item.canonicalProductId);
  if (!canonical) return false;

  const p: PreferenceRules = item.preferences;
  if (p.premiumOnly && !sku.premium) return false;
  if (p.kosherRequired) {
    const requiredAuthorities = p.kosherAuthorities ?? [];
    if (requiredAuthorities.length > 0) {
      const ok = requiredAuthorities.some((k) => sku.kosherAuthorities.includes(k));
      if (!ok) return false;
    }
  }
  if (p.brand === "strict" && canonical.brand && sku.brand && canonical.brand !== sku.brand) {
    return false;
  }
  const minSize = canonical.defaultSizeGram * (1 - p.packageSizeTolerancePercent / 100);
  const maxSize = canonical.defaultSizeGram * (1 + p.packageSizeTolerancePercent / 100);
  if (sku.sizeGram < minSize || sku.sizeGram > maxSize) return false;
  return true;
}

export function optimizeSingleStore(listId: string) {
  const list = shoppingLists.find((l) => l.id === listId);
  if (!list) return null;
  const defaultStorePreferences = userStoreFilterPreferences[list.userId] ?? {
    maxDistanceKm: 9999,
    whitelistStoreIds: [],
    blacklistStoreIds: []
  };

  return optimizeSingleStoreWithOptions(listId, {
    storePreferences: defaultStorePreferences
  });
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(a: Location, b: Location) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function isAllowedStore(
  storeId: string,
  storePreferences: UserStoreFilterPreferences,
  userLocation?: Location
) {
  if (storePreferences.blacklistStoreIds.includes(storeId)) return false;
  if (
    storePreferences.whitelistStoreIds.length > 0 &&
    !storePreferences.whitelistStoreIds.includes(storeId)
  ) {
    return false;
  }
  if (!userLocation) return true;

  const store = stores.find((s) => s.id === storeId);
  if (!store) return false;
  const dist = distanceKm(userLocation, { latitude: store.latitude, longitude: store.longitude });
  return dist <= storePreferences.maxDistanceKm;
}

export function optimizeSingleStoreWithOptions(listId: string, options: OptimizationOptions = {}) {
  const list = shoppingLists.find((l) => l.id === listId);
  if (!list) return null;
  const storePreferences = options.storePreferences ??
    userStoreFilterPreferences[list.userId] ?? {
      maxDistanceKm: 9999,
      whitelistStoreIds: [],
      blacklistStoreIds: []
    };

  const results = stores
    .filter((store) => isAllowedStore(store.id, storePreferences, options.userLocation))
    .map((store) => {
      let totalAgorot = 0;
      const items = [];

      for (const item of list.items) {
        const candidates = storeSkus
          .filter(
            (sku) =>
              sku.storeId === store.id &&
              sku.canonicalProductId === item.canonicalProductId &&
              matchesPreferences(item, sku)
          )
          .sort((a, b) => a.priceAgorot - b.priceAgorot);

        const chosen = candidates[0];
        if (!chosen) {
          if (!item.preferences.replaceable) {
            return null;
          }
          continue;
        }

        const line = chosen.priceAgorot * item.quantity;
        totalAgorot += line;
        items.push({
          itemId: item.id,
          canonicalProductId: item.canonicalProductId,
          storeSkuId: chosen.id,
          unitPriceAgorot: chosen.priceAgorot,
          quantity: item.quantity,
          linePriceAgorot: line
        });
      }

      return { store, totalAgorot, items };
    })
    .filter(Boolean)
    .sort((a, b) => (a?.totalAgorot ?? 0) - (b?.totalAgorot ?? 0));

  const winner = results[0];
  return {
    listId,
    recommended: winner,
    runnersUp: results.slice(1, 3),
    appliedStoreFilters: storePreferences
  };
}
