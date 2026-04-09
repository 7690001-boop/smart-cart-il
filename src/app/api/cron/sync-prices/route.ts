import { NextResponse } from "next/server";
import { upsertFromCentralFeed } from "@/lib/ingestion/centralFeed";

export async function GET() {
  const demoRows = [
    {
      sourceProductName: "Tnuva Milk 3% 1L",
      storeId: "s1",
      priceAgorot: 665,
      brand: "Tnuva",
      sizeGram: 1000,
      kosherAuthorities: ["Rabanut"],
      premium: false
    }
  ];
  const result = upsertFromCentralFeed(demoRows);
  return NextResponse.json({ mode: "demo-cron", ...result });
}
