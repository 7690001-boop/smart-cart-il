import { NextResponse } from "next/server";
import { syncOfficialRetailSources } from "@/lib/ingestion/syncOfficialSources";

export async function GET() {
  const correlationBase = `catalog-cron-${Date.now()}`;
  try {
    const catalogRun = await syncOfficialRetailSources({
      correlationId: `${correlationBase}-official`,
      idempotencyKey: `cron-catalog-${new Date().toISOString().slice(0, 13)}`,
      onlyDue: true
    });
    return NextResponse.json({ mode: "catalog-only", catalogRun });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
