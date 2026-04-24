"use client";

import { useState } from "react";

type Run = {
  id: string;
  source: string;
  startedAt: string;
  finishedAt?: string;
  status: string;
  fetchedItems: number;
  ingestedRows: number;
  errorMessage?: string;
};

type Source = {
  id: string;
  sourceKey: string;
  nameHe: string;
  feedUrl: string;
  isActive: boolean;
  syncCadenceMinutes: number;
  lastCatalogSyncAt: string | null;
  lastCatalogStatus: string | null;
  lastCatalogError: string | null;
  loginUsername: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("he-IL");
}

function errorHint(msg: string): string {
  if (/401|403|unauthorized|forbidden/i.test(msg)) return "הגישה נדחתה — ייתכן שנדרשים פרטי כניסה";
  if (/No CPFTA file|No Carrefour file|No Wolt file|No Victory file/i.test(msg)) return "כתובת ה-Feed עשויה להיות שגויה או שפורמט הדף השתנה";
  if (/fetch failed|ENOTFOUND|ETIMEDOUT/i.test(msg)) return "הגעה לשרת נכשלה — בדוק את כתובת ה-URL";
  if (/500|502|503|504/i.test(msg)) return "שגיאת שרת זמנית — נסה שוב מאוחר יותר";
  return "";
}

export default function ImportStatusClient({
  initialRuns,
  initialSources
}: {
  initialRuns: Run[];
  initialSources: Source[];
}) {
  const [sources, setSources] = useState(initialSources);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [retryingAll, setRetryingAll] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);

  async function retrySingle(sourceKey: string) {
    setSyncing((s) => ({ ...s, [sourceKey]: true }));
    const res = await fetch(`/api/admin/retail-sources/${sourceKey}/sync`, { method: "POST" });
    const data = await res.json() as { status?: string; errorMessage?: string };
    setSyncing((s) => ({ ...s, [sourceKey]: false }));
    setSources((prev) =>
      prev.map((s) =>
        s.sourceKey === sourceKey
          ? {
              ...s,
              lastCatalogSyncAt: new Date().toISOString(),
              lastCatalogStatus: res.ok && data.status === "success" ? "success" : "failed",
              lastCatalogError: data.errorMessage ?? null
            }
          : s
      )
    );
  }

  async function retryAllFailed() {
    setRetryingAll(true);
    setRetryResult(null);
    const res = await fetch("/api/admin/sync-failed", { method: "POST" });
    const data = await res.json() as { retried: number; results: { sourceKey: string; status: string }[] };
    setRetryingAll(false);
    const succeeded = data.results.filter((r) => r.status === "success").length;
    setRetryResult(`${data.retried} מקורות נסרקו מחדש — ${succeeded} הצליחו`);
    setSources((prev) =>
      prev.map((s) => {
        const result = data.results.find((r) => r.sourceKey === s.sourceKey);
        if (!result) return s;
        return {
          ...s,
          lastCatalogSyncAt: new Date().toISOString(),
          lastCatalogStatus: result.status === "success" ? "success" : "failed"
        };
      })
    );
  }

  const failedCount = sources.filter((s) => s.isActive && s.lastCatalogStatus === "failed").length;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">סטטוס ייבוא נתונים</h1>
        {failedCount > 0 && (
          <button
            onClick={retryAllFailed}
            disabled={retryingAll}
            className="rounded bg-orange-600 px-3 py-1.5 text-sm text-white hover:bg-orange-500 disabled:opacity-50"
          >
            {retryingAll ? "מסנכרן..." : `נסה שוב ${failedCount} כושלים`}
          </button>
        )}
      </div>

      {retryResult && (
        <div className="rounded bg-blue-50 p-3 text-sm text-blue-800">{retryResult}</div>
      )}

      <article className="rounded border bg-white p-4">
        <h2 className="mb-3 font-medium">מקורות קמעונאים</h2>
        <div className="space-y-2 text-sm">
          {sources.map((source) => (
            <div
              key={source.id}
              className={`rounded border p-3 ${
                source.lastCatalogStatus === "failed"
                  ? "border-red-200 bg-red-50"
                  : source.lastCatalogStatus === "success"
                  ? "border-green-100 bg-green-50"
                  : "bg-slate-50"
              } ${!source.isActive ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <strong>{source.nameHe}</strong>
                    {source.loginUsername && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                        {source.loginUsername}
                      </span>
                    )}
                    {!source.isActive && (
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">לא פעיל</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 break-all">{source.feedUrl}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    סנכרון אחרון: {formatDate(source.lastCatalogSyncAt)} | כל {source.syncCadenceMinutes} דק׳
                  </div>
                  {source.lastCatalogError && (
                    <div className="mt-1 space-y-0.5">
                      <div className="text-xs text-red-700 break-words">{source.lastCatalogError}</div>
                      {errorHint(source.lastCatalogError) && (
                        <div className="text-xs font-medium text-orange-700">
                          💡 {errorHint(source.lastCatalogError)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {source.isActive && (
                  <button
                    onClick={() => retrySingle(source.sourceKey)}
                    disabled={!!syncing[source.sourceKey]}
                    className="shrink-0 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {syncing[source.sourceKey] ? "..." : "נסה שוב"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {sources.length === 0 && <p>אין מקורות מוגדרים עדיין.</p>}
        </div>
      </article>

      <article className="rounded border bg-white p-4">
        <h2 className="mb-3 font-medium">ריצות ייבוא אחרונות</h2>
        <ul className="space-y-2 text-sm">
          {initialRuns.map((run) => (
            <li key={run.id} className={`rounded p-2 ${run.status === "failed" ? "bg-red-50" : "bg-slate-50"}`}>
              <div>
                מקור: <strong>{run.source}</strong> | סטטוס:{" "}
                <strong>{run.status === "success" ? "הצלחה" : "כשלון"}</strong>
              </div>
              <div className="text-slate-600">
                התחלה: {formatDate(run.startedAt)} | סיום: {formatDate(run.finishedAt)}
              </div>
              <div className="text-slate-600">
                נמשכו: {run.fetchedItems} | נשמרו: {run.ingestedRows}
              </div>
              {run.errorMessage && (
                <div className="text-red-700">{run.errorMessage}</div>
              )}
            </li>
          ))}
          {initialRuns.length === 0 && <li>אין עדיין ריצות ייבוא.</li>}
        </ul>
      </article>
    </section>
  );
}
