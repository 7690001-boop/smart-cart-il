import { authOptions } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { readIngestionHistory } from "@/lib/ingestion/history";
import { getServerSession } from "next-auth";
import ImportStatusClient from "./ImportStatusClient";

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
  const sources = await prisma.retailSource.findMany({
    orderBy: [{ isActive: "desc" }, { lastCatalogStatus: "desc" }, { updatedAt: "desc" }],
    take: 100
  });

  return (
    <ImportStatusClient
      initialRuns={runs.slice(0, 20).map((r) => ({
        id: r.id,
        source: r.source,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        status: r.status,
        fetchedItems: r.fetchedItems,
        ingestedRows: r.ingestedRows,
        errorMessage: r.errorMessage
      }))}
      initialSources={sources.map((s) => ({
        id: s.id,
        sourceKey: s.sourceKey,
        nameHe: s.nameHe,
        feedUrl: s.feedUrl,
        isActive: s.isActive,
        syncCadenceMinutes: s.syncCadenceMinutes,
        lastCatalogSyncAt: s.lastCatalogSyncAt?.toISOString() ?? null,
        lastCatalogStatus: s.lastCatalogStatus,
        lastCatalogError: s.lastCatalogError,
        loginUsername: s.loginUsername
      }))}
    />
  );
}
