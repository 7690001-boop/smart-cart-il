"use client";

import { useState } from "react";

type RetailSource = {
  id: string;
  sourceKey: string;
  nameHe: string;
  nameEn: string | null;
  storeId: string;
  feedUrl: string;
  authHint: string | null;
  loginUsername: string | null;
  loginPassword: string | null;
  syncCadenceMinutes: number;
  isActive: boolean;
  lastCatalogSyncAt: string | null;
  lastCatalogStatus: string | null;
  lastCatalogError: string | null;
};

type EditState = {
  nameHe: string;
  nameEn: string;
  feedUrl: string;
  authHint: string;
  loginUsername: string;
  loginPassword: string;
  syncCadenceMinutes: number;
};

type NewSourceState = {
  sourceKey: string;
  nameHe: string;
  nameEn: string;
  storeId: string;
  feedUrl: string;
  authHint: string;
  loginUsername: string;
  loginPassword: string;
  syncCadenceMinutes: number;
};

const FORMAT_OPTIONS = [
  { value: "cpfta-xml-listing", label: "CPFTA XML (publishedprices)" },
  { value: "carrefour-listing", label: "Carrefour / Mega (publishprice)" },
  { value: "wolt-listing", label: "Wolt" },
  { value: "victory-listing", label: "Victory (laibcatalog)" },
  { value: "json", label: "JSON feed" }
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("he-IL");
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
      status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    }`}>
      {status === "success" ? "הצלחה" : "כשלון"}
    </span>
  );
}

export default function RetailSourcesManager({ initialSources }: { initialSources: RetailSource[] }) {
  const [sources, setSources] = useState(initialSources);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditState | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSource, setNewSource] = useState<NewSourceState>({
    sourceKey: "", nameHe: "", nameEn: "", storeId: "", feedUrl: "",
    authHint: "cpfta-xml-listing", loginUsername: "", loginPassword: "", syncCadenceMinutes: 180
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(sourceKey: string, current: boolean) {
    const res = await fetch(`/api/admin/retail-sources/${sourceKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current })
    });
    if (!res.ok) return;
    setSources((s) => s.map((x) => x.sourceKey === sourceKey ? { ...x, isActive: !current } : x));
  }

  async function syncNow(sourceKey: string) {
    setSyncing((s) => ({ ...s, [sourceKey]: true }));
    const res = await fetch(`/api/admin/retail-sources/${sourceKey}/sync`, { method: "POST" });
    const data = await res.json() as { fetchedItems?: number; errorMessage?: string };
    setSyncing((s) => ({ ...s, [sourceKey]: false }));
    setSources((s) => s.map((x) => x.sourceKey === sourceKey ? {
      ...x,
      lastCatalogSyncAt: new Date().toISOString(),
      lastCatalogStatus: res.ok ? "success" : "failed",
      lastCatalogError: data.errorMessage ?? null
    } : x));
  }

  function startEdit(source: RetailSource) {
    setEditing(source.sourceKey);
    setShowEditPassword(false);
    setEditValues({
      nameHe: source.nameHe,
      nameEn: source.nameEn ?? "",
      feedUrl: source.feedUrl,
      authHint: source.authHint ?? "",
      loginUsername: source.loginUsername ?? "",
      loginPassword: source.loginPassword ?? "",
      syncCadenceMinutes: source.syncCadenceMinutes
    });
  }

  async function saveEdit(sourceKey: string) {
    if (!editValues) return;
    setSaving(true);
    const res = await fetch(`/api/admin/retail-sources/${sourceKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues)
    });
    setSaving(false);
    if (!res.ok) { setError("שמירה נכשלה"); return; }
    const updated = await res.json() as RetailSource;
    setSources((s) => s.map((x) => x.sourceKey === sourceKey ? { ...x, ...updated } : x));
    setEditing(null);
    setEditValues(null);
  }

  async function deleteSource(sourceKey: string) {
    if (!confirm(`למחוק את ${sourceKey}?`)) return;
    const res = await fetch(`/api/admin/retail-sources/${sourceKey}`, { method: "DELETE" });
    if (!res.ok) return;
    setSources((s) => s.filter((x) => x.sourceKey !== sourceKey));
  }

  async function addSource() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/retail-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newSource, storeId: newSource.storeId || newSource.sourceKey })
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setError(d.error ?? "שגיאה");
      return;
    }
    const created = await res.json() as RetailSource;
    setSources((s) => [created, ...s]);
    setShowAdd(false);
    setNewSource({ sourceKey: "", nameHe: "", nameEn: "", storeId: "", feedUrl: "", authHint: "cpfta-xml-listing", loginUsername: "", loginPassword: "", syncCadenceMinutes: 180 });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ניהול מקורות קמעונאים</h1>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          {showAdd ? "ביטול" : "+ הוסף מקור"}
        </button>
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {showAdd && (
        <div className="rounded border bg-white p-4 text-sm space-y-3">
          <h2 className="font-medium">מקור חדש</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["sourceKey", "מזהה (sourceKey)"],
              ["nameHe", "שם בעברית"],
              ["nameEn", "שם באנגלית"],
              ["feedUrl", "כתובת Feed"]
            ].map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">{label}</span>
                <input
                  className="rounded border px-2 py-1"
                  value={newSource[key as keyof NewSourceState] as string}
                  onChange={(e) => setNewSource((s) => ({ ...s, [key]: e.target.value }))}
                />
              </label>
            ))}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">פורמט</span>
              <select
                className="rounded border px-2 py-1"
                value={newSource.authHint}
                onChange={(e) => setNewSource((s) => ({ ...s, authHint: e.target.value }))}
              >
                {FORMAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">שם משתמש (אם נדרש)</span>
              <input
                className="rounded border px-2 py-1"
                autoComplete="off"
                value={newSource.loginUsername}
                onChange={(e) => setNewSource((s) => ({ ...s, loginUsername: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">סיסמה (אם נדרש)</span>
              <div className="flex gap-1">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="flex-1 rounded border px-2 py-1"
                  autoComplete="new-password"
                  value={newSource.loginPassword}
                  onChange={(e) => setNewSource((s) => ({ ...s, loginPassword: e.target.value }))}
                />
                <button type="button" onClick={() => setShowNewPassword((v) => !v)}
                  className="rounded border px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">
                  {showNewPassword ? "הסתר" : "הצג"}
                </button>
              </div>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">קצב סנכרון (דקות)</span>
              <input
                type="number" min={15}
                className="rounded border px-2 py-1"
                value={newSource.syncCadenceMinutes}
                onChange={(e) => setNewSource((s) => ({ ...s, syncCadenceMinutes: Number(e.target.value) }))}
              />
            </label>
          </div>
          <button
            onClick={addSource}
            disabled={saving || !newSource.sourceKey || !newSource.nameHe || !newSource.feedUrl}
            className="rounded bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
          >
            {saving ? "שומר..." : "צור מקור"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-right">
            <tr>
              <th className="px-3 py-2 font-medium">רשת</th>
              <th className="px-3 py-2 font-medium">פורמט</th>
              <th className="px-3 py-2 font-medium">פרטי גישה</th>
              <th className="px-3 py-2 font-medium">סנכרון אחרון</th>
              <th className="px-3 py-2 font-medium">סטטוס</th>
              <th className="px-3 py-2 font-medium">קצב</th>
              <th className="px-3 py-2 font-medium">פעיל</th>
              <th className="px-3 py-2 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sources.map((source) => (
              <>
                <tr key={source.sourceKey} className={`${!source.isActive ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{source.nameHe}</div>
                    <div className="text-xs text-slate-400">{source.sourceKey}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{source.authHint ?? "json"}</td>
                  <td className="px-3 py-2 text-xs">
                    {source.loginUsername
                      ? <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">{source.loginUsername}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{formatDate(source.lastCatalogSyncAt)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={source.lastCatalogStatus} />
                    {source.lastCatalogError && (
                      <div className="mt-0.5 max-w-xs truncate text-xs text-red-600" title={source.lastCatalogError}>
                        {source.lastCatalogError}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{source.syncCadenceMinutes}ד׳</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleActive(source.sourceKey, source.isActive)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                        source.isActive ? "bg-green-500" : "bg-slate-300"
                      }`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        source.isActive ? "translate-x-4" : "translate-x-0.5"
                      }`} />
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => syncNow(source.sourceKey)}
                        disabled={syncing[source.sourceKey]}
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500 disabled:opacity-50"
                      >
                        {syncing[source.sourceKey] ? "מסנכרן..." : "סנכרן עכשיו"}
                      </button>
                      <button
                        onClick={() => editing === source.sourceKey ? setEditing(null) : startEdit(source)}
                        className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        {editing === source.sourceKey ? "סגור" : "ערוך"}
                      </button>
                      <button
                        onClick={() => deleteSource(source.sourceKey)}
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
                {editing === source.sourceKey && editValues && (
                  <tr key={`${source.sourceKey}-edit`} className="bg-slate-50">
                    <td colSpan={8} className="px-3 py-3">
                      <div className="grid grid-cols-3 gap-3">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">שם בעברית</span>
                          <input className="rounded border px-2 py-1 text-sm" value={editValues.nameHe}
                            onChange={(e) => setEditValues((v) => v && ({ ...v, nameHe: e.target.value }))} />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">כתובת Feed</span>
                          <input className="rounded border px-2 py-1 text-sm" value={editValues.feedUrl}
                            onChange={(e) => setEditValues((v) => v && ({ ...v, feedUrl: e.target.value }))} />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">פורמט</span>
                          <select className="rounded border px-2 py-1 text-sm" value={editValues.authHint}
                            onChange={(e) => setEditValues((v) => v && ({ ...v, authHint: e.target.value }))}>
                            {FORMAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">שם משתמש</span>
                          <input className="rounded border px-2 py-1 text-sm" autoComplete="off"
                            value={editValues.loginUsername}
                            onChange={(e) => setEditValues((v) => v && ({ ...v, loginUsername: e.target.value }))} />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">סיסמה</span>
                          <div className="flex gap-1">
                            <input type={showEditPassword ? "text" : "password"}
                              className="flex-1 rounded border px-2 py-1 text-sm" autoComplete="new-password"
                              value={editValues.loginPassword}
                              onChange={(e) => setEditValues((v) => v && ({ ...v, loginPassword: e.target.value }))} />
                            <button type="button" onClick={() => setShowEditPassword((v) => !v)}
                              className="rounded border px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">
                              {showEditPassword ? "הסתר" : "הצג"}
                            </button>
                          </div>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">קצב סנכרון (דקות)</span>
                          <input type="number" min={15} className="rounded border px-2 py-1 text-sm"
                            value={editValues.syncCadenceMinutes}
                            onChange={(e) => setEditValues((v) => v && ({ ...v, syncCadenceMinutes: Number(e.target.value) }))} />
                        </label>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => saveEdit(source.sourceKey)} disabled={saving}
                          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50">
                          {saving ? "שומר..." : "שמור"}
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="rounded border px-3 py-1.5 text-sm hover:bg-white">
                          ביטול
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
