import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { userStoreFilterPreferences } from "@/lib/data";

const updateSchema = z.object({
  maxDistanceKm: z.number().min(0),
  whitelistStoreIds: z.array(z.string()),
  blacklistStoreIds: z.array(z.string())
});

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(
    userStoreFilterPreferences[userId] ?? {
      maxDistanceKm: 15,
      whitelistStoreIds: [],
      blacklistStoreIds: []
    }
  );
}

export async function PATCH(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = updateSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  userStoreFilterPreferences[userId] = body.data;
  return NextResponse.json(userStoreFilterPreferences[userId]);
}
