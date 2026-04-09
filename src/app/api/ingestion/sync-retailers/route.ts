import { NextResponse } from "next/server";
import { allowRequest } from "@/lib/rateLimit";
import { syncRetailerFeeds } from "@/lib/ingestion/syncRetailerFeeds";

export async function POST() {
  if (!allowRequest("ingestion-sync-retailers", 5, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  try {
    const run = await syncRetailerFeeds();
    return NextResponse.json(run);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Retailer sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
