import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  nameHe: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  feedUrl: z.string().min(1).optional(),
  authHint: z.string().optional(),
  syncCadenceMinutes: z.number().int().min(15).optional(),
  isActive: z.boolean().optional()
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) return null;
  return session;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const source = await prisma.retailSource.findUnique({ where: { sourceKey: id } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.retailSource.update({
    where: { sourceKey: id },
    data: {
      ...body.data,
      ...(body.data.feedUrl ? { linkHash: Buffer.from(body.data.feedUrl).toString("base64").slice(0, 16) } : {})
    }
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const source = await prisma.retailSource.findUnique({ where: { sourceKey: id } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.retailSource.delete({ where: { sourceKey: id } });
  return NextResponse.json({ deleted: true });
}
