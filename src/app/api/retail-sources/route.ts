import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const rows = await prisma.retailSource.findMany({
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    take: 500
  });
  return NextResponse.json(rows);
}
