import { NextResponse } from "next/server";
import { syncAllGovernmentItems } from "@/lib/ingestion/syncGovernmentCatalog";
import { syncOfficialRetailSources } from "@/lib/ingestion/syncOfficialSources";

export async function GET() {
  const correlationBase = `cron-${Date.now()}`;
  try {
    const governmentRun = await syncAllGovernmentItems({
      correlationId: `${correlationBase}-government`,
      idempotencyKey: `cron-government-${new Date().toISOString().slice(0, 10)}`
    });
    const officialRun = await syncOfficialRetailSources({
      correlationId: `${correlationBase}-official`,
      idempotencyKey: `cron-official-${new Date().toISOString().slice(0, 10)}`
    });
    return NextResponse.json({ mode: "scheduled", governmentRun, officialRun });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
