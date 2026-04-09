import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireDbUser, requireDefaultList } from "@/lib/sessionUser";

const createListSchema = z.object({
  name: z.string().min(1)
});

export async function GET() {
  const user = await requireDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireDefaultList(user.id);
  const lists = await prisma.shoppingList.findMany({
    where: { userId: user.id },
    include: { items: true }
  });
  return NextResponse.json(lists);
}

export async function POST(request: Request) {
  const user = await requireDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createListSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const list = await prisma.shoppingList.create({
    data: {
      userId: user.id,
      name: body.data.name
    }
  });
  return NextResponse.json(
    {
      id: list.id,
      userId: list.userId,
      name: list.name,
      items: []
    },
    { status: 201 }
  );
}
