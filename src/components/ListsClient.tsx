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
  cheapestPriceAgorot: number | null;
};

type EditState = {
  quantity: number;
  brand: string;
  kosherRequired: boolean;
};

function formatIls(agorot: number) {
  return `₪${(agorot / 100).toFixed(2)}`;
}

function estimateTotal(items: ListItem[], catalog: Record<string, CatalogItem>) {
  return items.reduce((sum, item) => {
    const price = catalog[item.canonicalProductId]?.cheapestPriceAgorot;
    if (!price) return sum;
    return sum + price * item.quantity;
  }, 0);
}

export default function ListsClient() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [catalog, setCatalog] = useState<Record<string, CatalogItem>>({});
  const [editing, setEditing] = useState<Record<string, EditState>>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
        const mapped = Object.fromEntries(items.map((i) => [i.id, i]));
        setCatalog(mapped);
      })
      .catch(() => undefined);
  }, []);

  async function createList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreatingList(true);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName.trim() }),
    });
    if (res.ok) {
      setNewListName("");
      setShowCreateForm(false);
      await load();
    }
    setCreatingList(false);
  }

  async function deleteList(listId: string) {
    if (!confirm("למחוק את הרשימה לצמיתות?")) return;
    const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  async function renameList(listId: string) {
    if (!renameValue.trim()) return;
    const res = await fetch(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    if (res.ok) {
      setRenamingId(null);
      await load();
    }
  }

  function startEdit(item: ListItem) {
    setEditing((prev) => ({
      ...prev,
      [item.id]: { quantity: item.quantity, brand: item.brand, kosherRequired: item.kosherRequired },
    }));
  }

  function cancelEdit(itemId: string) {
    setEditing((prev) => { const next = { ...prev }; delete next[itemId]; return next; });
  }

  async function saveEdit(listId: string, itemId: string) {
    const state = editing[itemId];
    if (!state) return;
    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, ...state }),
    });
    if (res.ok) { cancelEdit(itemId); await load(); }
  }

  async function removeItem(listId: string, itemId: string) {
    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    if (res.ok) await load();
  }

  function getProductName(canonicalProductId: string) {
    const item = catalog[canonicalProductId];
    return item?.nameHe ?? item?.name ?? canonicalProductId;
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {lists.length === 0 ? "אין רשימות עדיין" : `${lists.length} רשימות`}
        </p>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? "ביטול" : "+ רשימה חדשה"}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form
          onSubmit={createList}
          className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4"
        >
          <input
            autoFocus
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="שם הרשימה החדשה..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            dir="rtl"
          />
          <button
            type="submit"
            disabled={creatingList || !newListName.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-300"
          >
            {creatingList ? "יוצר..." : "צור"}
          </button>
        </form>
      )}

      {/* Empty state */}
      {lists.length === 0 && !showCreateForm && (
        <div className="rounded-xl border border-dashed border-slate-200 py-14 text-center text-slate-500">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-slate-700">אין רשימות קנייה</p>
          <p className="text-sm mt-1">צור רשימה חדשה והתחל להוסיף מוצרים מהקטלוג.</p>
        </div>
      )}

      {/* Lists */}
      {lists.map((list) => {
        const total = estimateTotal(list.items, catalog);
        const isRenaming = renamingId === list.id;

        return (
          <article key={list.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
            {/* List header */}
            <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3">
              {isRenaming ? (
                <div className="flex flex-1 gap-2">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameList(list.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => renameList(list.id)}
                    className="text-xs text-green-700 hover:underline"
                  >
                    שמור
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingId(null)}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    ביטול
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-semibold text-slate-900">{list.name}</h2>
                    <span className="text-xs text-slate-400">{list.items.length} פריטים</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {total > 0 && (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                        ~{formatIls(total)}
                      </span>
                    )}
                    <button
                      type="button"
                      title="שינוי שם"
                      onClick={() => { setRenamingId(list.id); setRenameValue(list.name); }}
                      className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      title="מחיקת רשימה"
                      onClick={() => deleteList(list.id)}
                      className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Items */}
            {list.items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                הרשימה ריקה — הוסף מוצרים מ
                <a href="/items" className="text-blue-600 hover:underline mx-1">קטלוג הפריטים</a>
              </p>
            ) : (
              <ul className="divide-y">
                {list.items.map((item) => {
                  const draft = editing[item.id];
                  const price = catalog[item.canonicalProductId]?.cheapestPriceAgorot;

                  return (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900">
                            {getProductName(item.canonicalProductId)}
                          </p>
                          {!draft && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              כמות: {item.quantity}
                              {" · "}
                              {item.brand === "strict" ? "מותג קבוע" : "גמיש"}
                              {" · "}
                              {item.kosherRequired ? "כשר" : "ללא דרישת כשרות"}
                            </p>
                          )}
                          {!draft && price && (
                            <p className="text-xs text-green-700 mt-0.5 font-medium">
                              {formatIls(price)} × {item.quantity} = {formatIls(price * item.quantity)}
                            </p>
                          )}
                        </div>
                        {!draft && (
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="rounded border border-blue-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
                            >
                              עריכה
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(list.id, item.id)}
                              className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                            >
                              הסר
                            </button>
                          </div>
                        )}
                      </div>

                      {draft && (
                        <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-16 text-slate-600 text-xs">כמות:</span>
                            <input
                              type="number"
                              min={1}
                              value={draft.quantity}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [item.id]: { ...draft, quantity: Math.max(1, Number(e.target.value)) },
                                }))
                              }
                              className="w-20 rounded border px-2 py-1 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-16 text-slate-600 text-xs">מותג:</span>
                            <select
                              value={draft.brand}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [item.id]: { ...draft, brand: e.target.value },
                                }))
                              }
                              className="rounded border px-2 py-1 text-sm"
                            >
                              <option value="flexible">גמיש</option>
                              <option value="strict">מותג קבוע</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-16 text-slate-600 text-xs">כשרות:</span>
                            <input
                              type="checkbox"
                              checked={draft.kosherRequired}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [item.id]: { ...draft, kosherRequired: e.target.checked },
                                }))
                              }
                            />
                            <span className="text-xs text-slate-600">
                              {draft.kosherRequired ? "נדרש" : "לא נדרש"}
                            </span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(list.id, item.id)}
                              className="rounded border border-green-400 px-3 py-1 text-xs text-green-700 hover:bg-green-50"
                            >
                              שמירה
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelEdit(item.id)}
                              className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                            >
                              ביטול
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}
