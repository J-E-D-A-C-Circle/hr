import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/staff/:path*",
    "/deductions/:path*",
    "/history/:path*",
    "/audit-logs/:path*",
    "/import/:path*",
    "/export/:path*",
  ],
};
