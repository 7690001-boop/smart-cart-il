import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { shoppingLists } from "@/lib/data";

const createListSchema = z.object({
  name: z.string().min(1)
});

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(shoppingLists.filter((l) => l.userId === userId));
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createListSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const list = {
    id: `l-${Date.now()}`,
    userId,
    name: body.data.name,
    items: []
  };
  shoppingLists.push(list);
  return NextResponse.json(list, { status: 201 });
}
