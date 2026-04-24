import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { syncSingleRetailSource } from "@/lib/ingestion/syncOfficialSources";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const failed = await prisma.retailSource.findMany({
    where: { isActive: true, lastCatalogStatus: "failed" },
    select: { sourceKey: true }
  });

  const results = await Promise.allSettled(
    failed.map((s) => syncSingleRetailSource(s.sourceKey))
  );

  const summary = results.map((r, i) => ({
    sourceKey: failed[i].sourceKey,
    status: r.status === "fulfilled" ? r.value.status : "error",
    error: r.status === "rejected" ? String(r.reason) : undefined
  }));

  return NextResponse.json({ retried: failed.length, results: summary });
}
