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

type CatalogItem = {
  id: string;
  name: string;
  nameHe?: string;
};

function fmt(agorot: number) {
  return `ILS ${(agorot / 100).toFixed(2)}`;
}

export default function OptimizeClient() {
  const [data, setData] = useState<OptimizeResponse | null>(null);
  const [catalogNames, setCatalogNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/items")
        .then((res) => (res.ok ? res.json() : []))
        .then((items: CatalogItem[]) =>
          Object.fromEntries(items.map((item) => [item.id, item.nameHe ?? item.name]))
        ),
      fetch("/api/lists").then((res) => (res.ok ? res.json() : []))
    ])
      .then(async ([names, lists]: [Record<string, string>, Array<{ id: string }>]) => {
        setCatalogNames(names);
        const listId = lists?.[0]?.id;
        if (!listId) {
          setError("לא נמצאה רשימת קניות.");
          return;
        }
        const optimize = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId })
        });
        if (!optimize.ok) {
          setError("אופטימיזציה נכשלה.");
          return;
        }
        setData((await optimize.json()) as OptimizeResponse);
      })
      .catch(() => setError("טעינת הנתונים נכשלה."));
  }, []);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-slate-600">מחשב סל מומלץ...</p>;

  return (
    <div className="space-y-4">
      <div className="rounded border bg-white p-3 text-sm text-slate-700">
        <div>מרחק מקסימלי: {data.appliedStoreFilters.maxDistanceKm} ק״מ</div>
        <div>
          רשימה לבנה:{" "}
          {data.appliedStoreFilters.whitelistStoreIds.length > 0
            ? data.appliedStoreFilters.whitelistStoreIds.join(", ")
            : "ללא"}
        </div>
        <div>
          רשימה שחורה:{" "}
          {data.appliedStoreFilters.blacklistStoreIds.length > 0
            ? data.appliedStoreFilters.blacklistStoreIds.join(", ")
            : "ללא"}
        </div>
        {data.note ? <div className="mt-2 text-amber-700">{data.note}</div> : null}
      </div>

      {!data.recommended ? (
        <p>לא נמצאה חנות מתאימה לפי ההעדפות והנתונים.</p>
      ) : (
        <article className="rounded border bg-white p-4">
          <h2 className="font-medium">המלצה: {data.recommended.store.nameHe}</h2>
          <p className="text-sm text-slate-700">סה״כ: {fmt(data.recommended.totalAgorot)}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {data.recommended.items.map((line) => (
              <li key={line.itemId} className="rounded bg-slate-50 p-2">
                {catalogNames[line.canonicalProductId] ?? line.canonicalProductId} x{line.quantity} ={" "}
                {fmt(line.linePriceAgorot)}
              </li>
            ))}
          </ul>
          <h3 className="mt-4 font-medium">חלופות נוספות</h3>
          <ul className="text-sm text-slate-700">
            {data.runnersUp.map((r) => (
              <li key={r.store.id}>
                {r.store.nameHe}: {fmt(r.totalAgorot)}
              </li>
            ))}
          </ul>
        </article>
      )}
    </div>
  );
}
