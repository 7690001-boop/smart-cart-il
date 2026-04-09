import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { shoppingLists } from "@/lib/data";
import { optimizeSingleStoreWithOptions } from "@/lib/optimizer/singleStore";
import { allowRequest } from "@/lib/rateLimit";

const bodySchema = z.object({
  listId: z.string().min(1),
  options: z
    .object({
      userLocation: z
        .object({
          latitude: z.number(),
          longitude: z.number()
        })
        .optional(),
      storePreferences: z
        .object({
          maxDistanceKm: z.number().min(0),
          whitelistStoreIds: z.array(z.string()),
          blacklistStoreIds: z.array(z.string())
        })
        .optional()
    })
    .optional()
});

export async function POST(request: Request) {
  if (!allowRequest("optimize", 90, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const list = shoppingLists.find((l) => l.id === body.data.listId && l.userId === userId);
  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

  const result = optimizeSingleStoreWithOptions(body.data.listId, body.data.options ?? {});
  return NextResponse.json(result);
}
