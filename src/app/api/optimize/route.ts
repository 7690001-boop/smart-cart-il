import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { shoppingLists } from "@/lib/data";
import { optimizeSingleStore } from "@/lib/optimizer/singleStore";
import { allowRequest } from "@/lib/rateLimit";

const bodySchema = z.object({
  listId: z.string().min(1)
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

  const result = optimizeSingleStore(body.data.listId);
  return NextResponse.json(result);
}
