import { canonicalProducts, shoppingLists, userStoreFilterPreferences } from "@/lib/data";
import { optimizeSingleStoreWithOptions } from "@/lib/optimizer/singleStore";

function fmt(agorot: number) {
  return `ILS ${(agorot / 100).toFixed(2)}`;
}

function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}

export default function OptimizePage() {
  const list = shoppingLists[0];
  const userLocation = { latitude: 32.0853, longitude: 34.7818 };
  const storePreferences = {
    ...userStoreFilterPreferences[list.userId],
    maxDistanceKm: userStoreFilterPreferences[list.userId]?.maxDistanceKm ?? 15
  };
  const result = optimizeSingleStoreWithOptions(list.id, { userLocation, storePreferences });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">תוצאת אופטימיזציה (חנות אחת)</h1>
      <div className="rounded border bg-white p-3 text-sm text-slate-700">
        <div>
          מיקום לדוגמה: {userLocation.latitude}, {userLocation.longitude}
        </div>
        <div>מרחק מקסימלי: {storePreferences.maxDistanceKm} ק״מ</div>
        <div>
          רשימה לבנה:{" "}
          {storePreferences.whitelistStoreIds.length > 0
            ? storePreferences.whitelistStoreIds.join(", ")
            : "ללא"}
        </div>
        <div>
          רשימה שחורה:{" "}
          {storePreferences.blacklistStoreIds.length > 0
            ? storePreferences.blacklistStoreIds.join(", ")
            : "ללא"}
        </div>
      </div>
      {!result?.recommended ? (
        <p>לא נמצאה חנות מתאימה לפי ההעדפות והמיקום.</p>
      ) : (
        <article className="rounded border bg-white p-4">
          <h2 className="font-medium">המלצה: {result.recommended.store.nameHe}</h2>
          <p className="text-sm text-slate-700">סה״כ: {fmt(result.recommended.totalAgorot)}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {result.recommended.items.map((line) => {
              const product = canonicalProducts.find((cp) => cp.id === line.canonicalProductId);
              return (
                <li key={line.itemId} className="rounded bg-slate-50 p-2">
                  {product?.name} x{line.quantity} = {fmt(line.linePriceAgorot)}
                </li>
              );
            })}
          </ul>
          <h3 className="mt-4 font-medium">חלופות נוספות</h3>
          <ul className="text-sm text-slate-700">
            {result.runnersUp.filter(isNonNull).map((r) => (
              <li key={r.store.id}>
                {r.store.nameHe}: {fmt(r.totalAgorot)}
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}
