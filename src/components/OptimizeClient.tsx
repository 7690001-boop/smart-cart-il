"use client";

import { useEffect, useState } from "react";

type OptimizeLine = {
  itemId: string;
  canonicalProductId: string;
  quantity: number;
  linePriceAgorot: number;
};

type OptimizeStoreResult = {
  store: { id: string; nameHe: string };
  totalAgorot: number;
  items: OptimizeLine[];
};

type OptimizeResponse = {
  listId: string;
  recommended: OptimizeStoreResult | null;
  runnersUp: OptimizeStoreResult[];
  appliedStoreFilters: {
    maxDistanceKm: number;
    whitelistStoreIds: string[];
    blacklistStoreIds: string[];
  };
  note?: string;
};

type ShoppingList = { id: string; name: string };
type CatalogItem = { id: string; name: string; nameHe?: string };

function fmt(agorot: number) {
  return `₪${(agorot / 100).toFixed(2)}`;
}

function PriceBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-20 text-left text-xs font-medium text-slate-700">{fmt(value)}</span>
    </div>
  );
}

export default function OptimizeClient() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [data, setData] = useState<OptimizeResponse | null>(null);
  const [catalogNames, setCatalogNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/items")
        .then((res) => (res.ok ? res.json() : []))
        .then((items: CatalogItem[]) =>
          Object.fromEntries(items.map((item) => [item.id, item.nameHe ?? item.name]))
        ),
      fetch("/api/lists")
        .then((res) => (res.ok ? res.json() : []))
        .then((l: ShoppingList[]) => l),
    ])
      .then(([names, fetchedLists]) => {
        setCatalogNames(names as Record<string, string>);
        const l = fetchedLists as ShoppingList[];
        setLists(l);
        if (l.length > 0) setSelectedListId(l[0].id);
      })
      .catch(() => setError("טעינת הנתונים נכשלה."));
  }, []);

  async function runOptimize() {
    if (!selectedListId) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: selectedListId }),
      });
      if (!res.ok) { setError("אופטימיזציה נכשלה."); return; }
      setData((await res.json()) as OptimizeResponse);
    } catch {
      setError("שגיאה בחיבור לשרת.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-run when list is selected for the first time
  useEffect(() => {
    if (selectedListId && !data && !loading) runOptimize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListId]);

  const allStores = data
    ? [data.recommended, ...data.runnersUp].filter(Boolean) as OptimizeStoreResult[]
    : [];
  const maxPrice = allStores.length > 0
    ? Math.max(...allStores.map((s) => s.totalAgorot))
    : 0;
  const savings =
    data?.recommended && allStores.length > 1
      ? maxPrice - data.recommended.totalAgorot
      : null;

  return (
    <div className="space-y-5">
      {/* List selector */}
      {lists.length > 0 && (
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">רשימת קניות</label>
            <select
              value={selectedListId ?? ""}
              onChange={(e) => {
                setSelectedListId(e.target.value);
                setData(null);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={runOptimize}
            disabled={loading || !selectedListId}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
          >
            {loading ? "מחשב..." : "חשב מחדש"}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-32 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
        </div>
      )}

      {/* No list */}
      {!loading && lists.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-200 py-14 text-center text-slate-500">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-semibold text-slate-700">אין רשימות קנייה</p>
          <p className="text-sm mt-1">
            <a href="/items" className="text-blue-600 hover:underline">הוסף מוצרים לרשימה</a>
            {" "}כדי לחשב אופטימיזציה.
          </p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Applied filters summary */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border bg-white px-3 py-1 text-slate-600">
              📍 עד {data.appliedStoreFilters.maxDistanceKm} ק״מ
            </span>
            {data.appliedStoreFilters.blacklistStoreIds.length > 0 && (
              <span className="rounded-full border bg-white px-3 py-1 text-red-600">
                🚫 {data.appliedStoreFilters.blacklistStoreIds.length} חנויות חסומות
              </span>
            )}
            {data.note && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                ⚠️ {data.note}
              </span>
            )}
          </div>

          {!data.recommended ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              לא נמצאה חנות מתאימה לפי ההעדפות והנתונים.
            </p>
          ) : (
            <>
              {/* Recommended store card */}
              <article className="rounded-xl border-2 border-green-400 bg-green-50 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-green-600">
                      ✓ מומלץ
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {data.recommended.store.nameHe}
                    </h2>
                    <p className="mt-1 text-2xl font-extrabold text-green-700">
                      {fmt(data.recommended.totalAgorot)}
                    </p>
                  </div>
                  {savings !== null && savings > 0 && (
                    <div className="rounded-xl bg-green-600 px-4 py-3 text-center text-white shadow-md">
                      <p className="text-xs font-medium opacity-90">חיסכון</p>
                      <p className="text-lg font-extrabold">{fmt(savings)}</p>
                    </div>
                  )}
                </div>

                <ul className="mt-4 space-y-1.5">
                  {data.recommended.items.map((line) => (
                    <li key={line.itemId} className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm">
                      <span className="flex-1 min-w-0 truncate text-slate-800">
                        {catalogNames[line.canonicalProductId] ?? line.canonicalProductId}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">×{line.quantity}</span>
                      <span className="shrink-0 font-semibold text-green-700">{fmt(line.linePriceAgorot)}</span>
                    </li>
                  ))}
                </ul>
              </article>

              {/* Store comparison */}
              {allStores.length > 1 && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-slate-600">
                    השוואת חנויות
                  </h3>
                  <div className="rounded-xl border bg-white p-4 space-y-3">
                    {allStores.map((store, i) => (
                      <div key={store.store.id} className="flex items-center gap-3">
                        <div className="w-28 shrink-0">
                          <p className={`text-sm truncate font-medium ${i === 0 ? "text-green-700" : "text-slate-700"}`}>
                            {store.store.nameHe}
                          </p>
                        </div>
                        <div className="flex-1">
                          <PriceBar value={store.totalAgorot} max={maxPrice} />
                        </div>
                        {i === 0 && (
                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            זול ביותר
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
