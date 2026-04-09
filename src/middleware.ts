import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey && request.headers.get("x-admin-key") !== adminKey) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"]
};
