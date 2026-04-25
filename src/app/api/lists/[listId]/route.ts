import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/sessionUser";

const renameSchema = z.object({ name: z.string().min(1) });

async function getOwnedList(userId: string, listId: string) {
  return prisma.shoppingList.findFirst({ where: { id: listId, userId } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  const user = await requireDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const list = await getOwnedList(user.id, listId);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.shoppingList.delete({ where: { id: listId } });
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  const user = await requireDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const list = await getOwnedList(user.id, listId);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = renameSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const updated = await prisma.shoppingList.update({
    where: { id: listId },
    data: { name: body.data.name },
    include: { items: true },
  });
  return NextResponse.json(updated);
}
