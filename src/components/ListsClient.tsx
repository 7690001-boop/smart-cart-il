"use client";

import { useEffect, useState } from "react";

type ListItem = {
  id: string;
  canonicalProductId: string;
  quantity: number;
  brand: string;
  kosherRequired: boolean;
};

type ShoppingList = {
  id: string;
  name: string;
  items: ListItem[];
};

type CatalogItem = {
  id: string;
  name: string;
  nameHe?: string;
};

export default function ListsClient() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [catalogNames, setCatalogNames] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/lists");
    if (!res.ok) return;
    const data = (await res.json()) as ShoppingList[];
    setLists(data);
  }

  useEffect(() => {
    load().catch(() => undefined);
    fetch("/api/items")
      .then((res) => (res.ok ? res.json() : []))
      .then((items: CatalogItem[]) => {
        const mapped = Object.fromEntries(items.map((i) => [i.id, i.nameHe ?? i.name]));
        setCatalogNames(mapped);
      })
      .catch(() => undefined);
  }, []);

  async function removeItem(listId: string, itemId: string) {
    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId })
    });
    if (res.ok) await load();
  }

  if (lists.length === 0) {
    return <p className="text-sm text-slate-600">עדיין אין רשימות. התחבר והוסף מוצרים מקטלוג הפריטים.</p>;
  }

  return (
    <div className="space-y-4">
      {lists.map((list) => (
        <article key={list.id} className="rounded border bg-white p-4">
          <h2 className="font-medium">שם הרשימה: {list.name}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {list.items.map((item) => (
              <li key={item.id} className="rounded bg-slate-50 p-2">
                <div>{catalogNames[item.canonicalProductId] ?? item.canonicalProductId}</div>
                <div className="text-slate-600">
                  כמות: {item.quantity} | מותג: {item.brand === "strict" ? "מותג קבוע" : "גמיש"} | כשרות:{" "}
                  {item.kosherRequired ? "נדרש" : "לא נדרש"}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(list.id, item.id)}
                  className="mt-2 rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                >
                  הסרה מהרשימה
                </button>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
