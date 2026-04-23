import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  sourceKey: z.string().min(1),
  nameHe: z.string().min(1),
  nameEn: z.string().optional(),
  storeId: z.string().min(1),
  feedUrl: z.string().min(1),
  authHint: z.string().optional(),
  syncCadenceMinutes: z.number().int().min(15).default(180)
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sources = await prisma.retailSource.findMany({
    orderBy: [{ isActive: "desc" }, { nameHe: "asc" }]
  });
  return NextResponse.json(sources);
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = createSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await prisma.retailSource.findUnique({ where: { sourceKey: body.data.sourceKey } });
  if (existing) return NextResponse.json({ error: "sourceKey already exists" }, { status: 409 });

  const source = await prisma.retailSource.create({
    data: {
      sourceKey: body.data.sourceKey,
      nameHe: body.data.nameHe,
      nameEn: body.data.nameEn,
      storeId: body.data.storeId,
      feedUrl: body.data.feedUrl,
      authHint: body.data.authHint,
      linkHash: Buffer.from(body.data.feedUrl).toString("base64").slice(0, 16),
      isActive: true,
      discoveredFrom: "admin",
      lastSeenAt: new Date(),
      syncCadenceMinutes: body.data.syncCadenceMinutes
    }
  });
  return NextResponse.json(source, { status: 201 });
}
