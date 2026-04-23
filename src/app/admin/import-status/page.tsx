import { authOptions } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { readIngestionHistory } from "@/lib/ingestion/history";
import { getServerSession } from "next-auth";

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("he-IL");
}

export default async function AdminImportStatusPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return (
      <section className="space-y-4 rounded border bg-white p-4">
        <h1 className="text-xl font-semibold">סטטוס ייבוא</h1>
        <p className="text-sm text-slate-700">אין הרשאת מנהל לחשבון הזה.</p>
      </section>
    );
  }

  const runs = await readIngestionHistory();
  const latestRuns = runs.slice(0, 8);
  const sources = await prisma.retailSource.findMany({
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    take: 100
  });

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">סטטוס ייבוא נתונים</h1>

      <article className="rounded border bg-white p-4">
        <h2 className="mb-2 font-medium">ריצות ייבוא אחרונות</h2>
        <ul className="space-y-2 text-sm">
          {latestRuns.map((run) => (
            <li key={run.id} className="rounded bg-slate-50 p-2">
              <div>
                מקור: <strong>{run.source}</strong> | סטטוס:{" "}
                <strong>{run.status === "success" ? "הצלחה" : "כשלון"}</strong>
              </div>
              <div className="text-slate-700">
                התחלה: {formatDate(run.startedAt)} | סיום: {formatDate(run.finishedAt)}
              </div>
              <div className="text-slate-700">
                נמשכו: {run.fetchedItems} | נשמרו: {run.ingestedRows}
              </div>
              {run.errorMessage && (
                <div className="text-red-700">שגיאה: {run.errorMessage}</div>
              )}
            </li>
          ))}
          {latestRuns.length === 0 && <li>אין עדיין ריצות ייבוא.</li>}
        </ul>
      </article>

      <article className="rounded border bg-white p-4">
        <h2 className="mb-2 font-medium">סטטוס מקורות קמעונאים</h2>
        <ul className="space-y-2 text-sm">
          {sources.map((source) => (
            <li key={source.id} className="rounded bg-slate-50 p-2">
              <div>
                <strong>{source.nameHe}</strong> | פעיל: {source.isActive ? "כן" : "לא"}
              </div>
              <div className="text-slate-700">קישור: {source.feedUrl}</div>
              <div className="text-slate-700">
                קצב סריקה: כל {source.syncCadenceMinutes} דק׳ | סנכרון אחרון:{" "}
                {formatDate(source.lastCatalogSyncAt)}
              </div>
              <div className="text-slate-700">
                סטטוס אחרון: {source.lastCatalogStatus ?? "—"}
                {source.lastCatalogError ? ` | שגיאה: ${source.lastCatalogError}` : ""}
              </div>
              <div className="text-slate-700">נצפה לאחרונה: {formatDate(source.lastSeenAt)}</div>
            </li>
          ))}
          {sources.length === 0 && <li>אין מקורות מוגדרים עדיין.</li>}
        </ul>
      </article>
    </section>
  );
}
