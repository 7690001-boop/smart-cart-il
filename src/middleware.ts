import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    const adminKey = process.env.ADMIN_API_KEY;
    const providedAdminKey = request.headers.get("x-admin-key");
    if (adminKey && providedAdminKey && providedAdminKey !== adminKey) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  if (
    request.nextUrl.pathname.startsWith("/api/cron") ||
    request.nextUrl.pathname.startsWith("/api/ingestion")
  ) {
    const ingestionKey = process.env.INGESTION_API_KEY;
    if (ingestionKey && request.headers.get("x-api-key") !== ingestionKey) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/cron/:path*", "/api/ingestion/:path*"]
};
