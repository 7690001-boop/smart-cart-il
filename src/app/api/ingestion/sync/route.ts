import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertFromCentralFeed } from "@/lib/ingestion/centralFeed";
import { allowRequest } from "@/lib/rateLimit";

const payloadSchema = z.array(
  z.object({
    sourceProductName: z.string().min(1),
    storeId: z.string().min(1),
    priceAgorot: z.number().int().positive(),
    brand: z.string().optional(),
    sizeGram: z.number().optional(),
    kosherAuthorities: z.array(z.string()).optional(),
    premium: z.boolean().optional()
  })
);

export async function POST(request: Request) {
  if (!allowRequest("ingestion-sync", 30, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const body = payloadSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  return NextResponse.json(upsertFromCentralFeed(body.data));
}
