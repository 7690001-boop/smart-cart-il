import { NextResponse } from "next/server";
import { syncCpftaRetailRegistry } from "@/lib/ingestion/cpftaRegistry";
import { syncOfficialRetailSources } from "@/lib/ingestion/syncOfficialSources";

export async function GET() {
  const correlationBase = `cron-legacy-${Date.now()}`;
  try {
    const registryRun = await syncCpftaRetailRegistry();
    const officialRun = await syncOfficialRetailSources({
      correlationId: `${correlationBase}-official`,
      idempotencyKey: `cron-legacy-catalog-${new Date().toISOString().slice(0, 13)}`,
      onlyDue: true
    });
    return NextResponse.json({ mode: "scheduled-legacy", registryRun, officialRun });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
