import { authOptions } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import RetailSourcesManager from "./RetailSourcesManager";

export default async function AdminRetailSourcesPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return (
      <section className="rounded border bg-white p-4">
        <h1 className="text-xl font-semibold">ניהול מקורות</h1>
        <p className="mt-2 text-sm text-slate-700">אין הרשאת מנהל לחשבון הזה.</p>
      </section>
    );
  }

  const rows = await prisma.retailSource.findMany({
    orderBy: [{ isActive: "desc" }, { nameHe: "asc" }]
  });

  const sources = rows.map((s) => ({
    ...s,
    lastCatalogSyncAt: s.lastCatalogSyncAt?.toISOString() ?? null,
    lastSeenAt: s.lastSeenAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString()
  }));

  return <RetailSourcesManager initialSources={sources} />;
}
