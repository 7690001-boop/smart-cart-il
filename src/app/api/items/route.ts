import { NextResponse } from "next/server";
import { canonicalProducts } from "@/lib/data";

export async function GET() {
  return NextResponse.json(canonicalProducts);
}
