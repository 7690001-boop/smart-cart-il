import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/sessionUser";

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
  const user = await requireDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId: user.id }
  });
  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

  const body = addItemSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const item = await prisma.shoppingListItem.create({
    data: {
      listId,
      productId: body.data.canonicalProductId,
      quantity: body.data.quantity,
      brandPreference: body.data.preferences.brand,
      kosherRequired: body.data.preferences.kosherRequired
    }
  });
  return NextResponse.json(item, { status: 201 });
}

const patchSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  brandPreference: z.enum(["strict", "flexible", "any"]).optional(),
  kosherRequired: z.boolean().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const user = await requireDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { listId } = await params;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId: user.id }
  });
  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

  const { itemId, ...updates } = body.data;
  const item = await prisma.shoppingListItem.updateMany({
    where: { id: itemId, listId },
    data: updates
  });
  return NextResponse.json(item);
}

const deleteSchema = z.object({
  itemId: z.string().min(1)
});

export async function DELETE(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  const user = await requireDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { listId } = await params;
  const body = deleteSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId: user.id }
  });
  if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

  await prisma.shoppingListItem.deleteMany({
    where: { id: body.data.itemId, listId }
  });
  return NextResponse.json({ ok: true });
}
