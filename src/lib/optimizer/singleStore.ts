import { canonicalProducts, shoppingLists, storeSkus, stores } from "@/lib/data";
import { PreferenceRules, ShoppingListItem, StoreSku } from "@/lib/types";

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

  const results = stores
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
    runnersUp: results.slice(1, 3)
  };
}
