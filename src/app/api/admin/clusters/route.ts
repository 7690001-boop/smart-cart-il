import { NextResponse } from "next/server";
import { z } from "zod";
import { clusterReviewQueue } from "@/lib/data";

const updateSchema = z.object({
  id: z.string(),
  status: z.enum(["approved", "rejected"]),
  reviewedBy: z.string().min(1)
});

export async function GET() {
  return NextResponse.json(clusterReviewQueue);
}

export async function PATCH(request: Request) {
  const body = updateSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const item = clusterReviewQueue.find((q) => q.id === body.data.id);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  item.status = body.data.status;
  item.reviewedBy = body.data.reviewedBy;
  return NextResponse.json(item);
}
