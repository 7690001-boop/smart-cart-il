import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/sessionUser";

const updateSchema = z.object({
  excludedChains: z.array(z.string()).max(50).optional()
});

export async function GET() {
  const user = await requireDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userPreferenceProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id }
  });
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const user = await requireDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = updateSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const profile = await prisma.userPreferenceProfile.upsert({
    where: { userId: user.id },
    update: body.data,
    create: { userId: user.id, ...body.data }
  });
  return NextResponse.json(profile);
}
