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
type SortMode = "price" | "name" | "offers";

function formatIls(agorot: number | null) {
  if (agorot === null) return "אין מחיר";
  return `₪${(agorot / 100).toFixed(2)}`;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-white p-4 animate-pulse">
      <div className="h-4 w-3/4 rounded bg-slate-200 mb-2" />
      <div className="h-3 w-1/2 rounded bg-slate-100 mb-3" />
      <div className="h-5 w-1/3 rounded bg-slate-200" />
    </div>
  );
}

export default function ItemCatalogSelector() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("price");
  const [listId, setListId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data: CatalogItem[]) => { setItems(data); setLoading(false); })
      .catch(() => { setItems([]); setLoading(false); });

    fetch("/api/lists")
      .then((res) => (res.ok ? res.json() : []))
      .then((lists: Array<{ id: string }>) => {
        if (lists.length > 0) setListId(lists[0].id);
      })
      .catch(() => setListId(null));

    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try { setSelected(JSON.parse(saved) as string[]); } catch { setSelected([]); }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(selected));
  }, [selected]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.categoryHe ?? i.category));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let result = [...items];

    if (activeCategory !== "all") {
      result = result.filter((item) => (item.categoryHe ?? item.category) === activeCategory);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (item) =>
          (item.nameHe ?? item.name).toLowerCase().includes(q) ||
          (item.brandHe ?? item.brand ?? "").toLowerCase().includes(q) ||
          (item.categoryHe ?? item.category).toLowerCase().includes(q)
      );
    }

    if (sortMode === "price") {
      result.sort((a, b) => {
        if (a.cheapestPriceAgorot === null) return 1;
        if (b.cheapestPriceAgorot === null) return -1;
        return a.cheapestPriceAgorot - b.cheapestPriceAgorot;
      });
    } else if (sortMode === "name") {
      result.sort((a, b) => (a.nameHe ?? a.name).localeCompare(b.nameHe ?? b.name, "he"));
    } else {
      result.sort((a, b) => b.offersCount - a.offersCount);
    }

    return result;
  }, [items, query, activeCategory, sortMode]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function addSelectedToList() {
    if (!listId || selected.length === 0) return;
    setAdding(true);
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
            replaceable: true,
          },
        }),
      });
      if (res.ok) success += 1;
    }
    setAdding(false);
    setStatusMessage(`נוספו ${success} פריטים לרשימה`);
    setSelected([]);
    setTimeout(() => setStatusMessage(""), 3500);
  }

  const categoryCount = (cat: string) =>
    items.filter((i) => (i.categoryHe ?? i.category) === cat).length;

  return (
    <div className={`space-y-4 ${selected.length > 0 ? "pb-24" : ""}`}>
      {/* Search + sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש מוצר, מותג, קטגוריה..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            dir="rtl"
          />
        </div>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="price">מחיר זול קודם</option>
          <option value="name">שם א-ת</option>
          <option value="offers">הכי מוצע</option>
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors
            ${activeCategory === "all" ? "bg-blue-600 text-white shadow-sm" : "border bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          הכל {!loading && `(${items.length})`}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors
              ${activeCategory === cat ? "bg-blue-600 text-white shadow-sm" : "border bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {cat} ({categoryCount(cat)})
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {loading ? "טוען מוצרים..." : `${filtered.length} מוצרים`}
          {selected.length > 0 && ` · ${selected.length} נבחרו`}
        </span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            נקה בחירה
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
          ✓ {statusMessage}
        </div>
      )}

      {/* Grid */}
      <ul className="grid gap-3 sm:grid-cols-2">
        {loading
          ? [...Array(8)].map((_, i) => <li key={i}><SkeletonCard /></li>)
          : filtered.map((item) => {
              const isSelected = selected.includes(item.id);
              return (
                <li key={item.id}>
                  <label
                    className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-all
                      ${isSelected
                        ? "border-blue-400 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(item.id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-snug text-slate-900">
                        {item.nameHe ?? item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.categoryHe ?? item.category}
                        {(item.brandHe ?? item.brand) && ` · ${item.brandHe ?? item.brand}`}
                      </p>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className={`text-base font-bold ${item.cheapestPriceAgorot ? "text-green-700" : "text-slate-400"}`}>
                          {formatIls(item.cheapestPriceAgorot)}
                        </span>
                        {item.cheapestStoreNameHe && (
                          <span className="text-xs text-slate-400">ב{item.cheapestStoreNameHe}</span>
                        )}
                      </div>
                      {item.offersCount > 1 && (
                        <p className="mt-0.5 text-xs text-blue-600">
                          {item.offersCount} הצעות מחיר
                        </p>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
      </ul>

      {filtered.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-500">
          <p className="text-3xl mb-2">🔍</p>
          <p className="font-medium">לא נמצאו מוצרים</p>
          <p className="text-sm mt-1">נסה מילות חיפוש אחרות או קטגוריה אחרת</p>
        </div>
      )}

      {/* Floating action bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">{selected.length} פריטים נבחרו</p>
              {!listId && <p className="text-xs text-amber-600">יש להתחבר כדי להוסיף לרשימה</p>}
            </div>
            <button
              type="button"
              onClick={addSelectedToList}
              disabled={!listId || adding}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
            >
              {adding ? "מוסיף..." : `הוסף לרשימה ←`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
