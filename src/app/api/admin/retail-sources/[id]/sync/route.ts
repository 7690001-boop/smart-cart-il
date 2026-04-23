import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { syncSingleRetailSource } from "@/lib/ingestion/syncOfficialSources";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const result = await syncSingleRetailSource(id);
  return NextResponse.json(result, { status: result.status === "success" ? 200 : 500 });
}
