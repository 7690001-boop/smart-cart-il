import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { canonicalProducts, shoppingLists } from "@/lib/data";

const addItemSchema = z.object({
  canonicalProductId: z.string().min(1),
  quantity: z.number().int().positive(),
  preferences: z.object({
    brand: z.enum(["strict", "flexible"]),
    kosherRequired: z.boolean(),
    kosherAuthorities: z.array(z.string()).optional(),
    premiumOnly: z.boolean(),
    packageSizeTolerancePercent: z.number().min(0).max(100),
    replaceable: z.boolean()
  })
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const list = shoppingLists.find((l) => l.id === listId && l.userId === userId);
  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

  const body = addItemSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  if (!canonicalProducts.some((cp) => cp.id === body.data.canonicalProductId)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const item = { id: `li-${Date.now()}`, ...body.data };
  list.items.push(item);
  return NextResponse.json(item, { status: 201 });
}
