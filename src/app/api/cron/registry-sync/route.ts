import { NextResponse } from "next/server";
import { syncCpftaRetailRegistry } from "@/lib/ingestion/cpftaRegistry";

export async function GET() {
  try {
    const registryRun = await syncCpftaRetailRegistry();
    return NextResponse.json({ mode: "registry-only", registryRun });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registry sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
