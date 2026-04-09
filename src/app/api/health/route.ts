import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      service: "smart-cart-il",
      ts: new Date().toISOString(),
      checks: { database: "ok" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      {
        status: "degraded",
        service: "smart-cart-il",
        ts: new Date().toISOString(),
        checks: { database: "failed" },
        error: message
      },
      { status: 503 }
    );
  }
}
