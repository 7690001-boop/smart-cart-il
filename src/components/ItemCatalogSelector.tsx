"use client";

import { useEffect, useMemo, useState } from "react";

type CatalogItem = {
  id: string;
  name: string;
  nameHe?: string;
  category: string;
  categoryHe?: string;
  brand?: string;
  brandHe?: string;
  defaultSizeGram: number;
  cheapestPriceAgorot: number | null;
  cheapestStoreNameHe: string | null;
  offersCount: number;
};

const storageKey = "smart-cart-selected-items";

function formatIls(agorot: number | null) {
  if (agorot === null) return "אין מחיר";
  return `₪ ${(agorot / 100).toFixed(2)}`;
}

export default function ItemCatalogSelector() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [listId, setListId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data: CatalogItem[]) => setItems(data))
      .catch(() => setItems([]));

    fetch("/api/lists")
      .then((res) => (res.ok ? res.json() : []))
      .then((lists: Array<{ id: string }>) => {
        if (lists.length > 0) setListId(lists[0].id);
      })
      .catch(() => setListId(null));

    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        setSelected(parsed);
      } catch {
        setSelected([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(selected));
  }, [selected]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function addSelectedToList() {
    if (!listId || selected.length === 0) return;
    let success = 0;
    for (const productId of selected) {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canonicalProductId: productId,
          quantity: 1,
          preferences: {
            brand: "flexible",
            kosherRequired: false,
            kosherAuthorities: [],
            premiumOnly: false,
            packageSizeTolerancePercent: 20,
            replaceable: true
          }
        })
      });
      if (res.ok) success += 1;
    }
    setStatusMessage(`נוספו ${success} פריטים לרשימה`);
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">נבחרו {selected.length} פריטים</div>
      <button
        type="button"
        onClick={addSelectedToList}
        disabled={!listId || selected.length === 0}
        className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        הוספה לרשימת הקניות
      </button>
      {statusMessage ? <div className="text-xs text-green-700">{statusMessage}</div> : null}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש מוצר..."
        className="w-full rounded border p-2"
      />
      <ul className="space-y-2">
        {filtered.map((item) => (
          <li key={item.id} className="rounded border bg-white p-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => toggle(item.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">{item.nameHe ?? item.name}</span>
                <span className="text-sm text-slate-600">
                  קטגוריה: {item.categoryHe ?? item.category} | מותג:{" "}
                  {item.brandHe ?? item.brand ?? "ללא"} | גודל:{" "}
                  {item.defaultSizeGram} גרם
                </span>
                <span className="block text-sm text-slate-700">
                  מחיר זול: {formatIls(item.cheapestPriceAgorot)}{" "}
                  {item.cheapestStoreNameHe ? `(${item.cheapestStoreNameHe})` : ""} | הצעות:{" "}
                  {item.offersCount}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
