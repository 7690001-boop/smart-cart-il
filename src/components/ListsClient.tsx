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

type EditState = {
  quantity: number;
  brand: string;
  kosherRequired: boolean;
};

export default function ListsClient() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [catalogNames, setCatalogNames] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, EditState>>({});

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

  function startEdit(item: ListItem) {
    setEditing((prev) => ({
      ...prev,
      [item.id]: { quantity: item.quantity, brand: item.brand, kosherRequired: item.kosherRequired }
    }));
  }

  function cancelEdit(itemId: string) {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }

  async function saveEdit(listId: string, itemId: string) {
    const state = editing[itemId];
    if (!state) return;
    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, ...state })
    });
    if (res.ok) {
      cancelEdit(itemId);
      await load();
    }
  }

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
            {list.items.map((item) => {
              const draft = editing[item.id];
              return (
                <li key={item.id} className="rounded bg-slate-50 p-2">
                  <div>{catalogNames[item.canonicalProductId] ?? item.canonicalProductId}</div>

                  {draft ? (
                    <div className="mt-2 space-y-1">
                      <label className="flex items-center gap-2">
                        <span className="w-14 text-slate-600">כמות:</span>
                        <input
                          type="number"
                          min={1}
                          value={draft.quantity}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [item.id]: { ...draft, quantity: Math.max(1, Number(e.target.value)) }
                            }))
                          }
                          className="w-20 rounded border px-2 py-0.5"
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="w-14 text-slate-600">מותג:</span>
                        <select
                          value={draft.brand}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [item.id]: { ...draft, brand: e.target.value }
                            }))
                          }
                          className="rounded border px-2 py-0.5"
                        >
                          <option value="flexible">גמיש</option>
                          <option value="strict">מותג קבוע</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="w-14 text-slate-600">כשרות:</span>
                        <input
                          type="checkbox"
                          checked={draft.kosherRequired}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [item.id]: { ...draft, kosherRequired: e.target.checked }
                            }))
                          }
                        />
                        <span className="text-slate-600">{draft.kosherRequired ? "נדרש" : "לא נדרש"}</span>
                      </label>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => saveEdit(list.id, item.id)}
                          className="rounded border border-green-400 px-2 py-1 text-xs text-green-700"
                        >
                          שמירה
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelEdit(item.id)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600"
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-600">
                      כמות: {item.quantity} | מותג: {item.brand === "strict" ? "מותג קבוע" : "גמיש"} | כשרות:{" "}
                      {item.kosherRequired ? "נדרש" : "לא נדרש"}
                    </div>
                  )}

                  {!draft && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-700"
                      >
                        עריכה
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(list.id, item.id)}
                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                      >
                        הסרה מהרשימה
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}
