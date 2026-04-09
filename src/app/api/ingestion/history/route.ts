import { NextResponse } from "next/server";
import { readIngestionHistory } from "@/lib/ingestion/history";

export async function GET() {
  const history = await readIngestionHistory();
  return NextResponse.json(history);
}
