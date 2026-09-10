import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TEMPSTAFF_SESSION_COOKIE = "staff_admin_session";
const TEMPSTAFF_SESSION_VALUE = "authenticated_admin_active";
const RETIREMENT_SESSION_COOKIE = "dvla_retirement_session";
const ADMIN_SESSION_COOKIE = "dvla_super_admin_session";

// Public paths that never need auth
const TEMPSTAFF_PUBLIC = ["/login", "/api/auth"];
const RETIREMENT_PUBLIC = ["/retirement/login", "/api/retirement/auth"];
const ADMIN_PUBLIC = ["/admin/login", "/api/admin/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin portal ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const isPublic = ADMIN_PUBLIC.some((p) => pathname.startsWith(p));
    if (isPublic) return NextResponse.next();

    const session = request.cookies.get(ADMIN_SESSION_COOKIE);
    let isValid = false;
    if (session?.value && session.value !== "logged_out") {
      try {
        const parsed = JSON.parse(session.value);
        isValid = parsed?.role === "SUPER_ADMIN";
      } catch {
        isValid = false;
      }
    }
    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Retirement portal ──────────────────────────────────────────────────────
  if (pathname.startsWith("/retirement")) {
    const isPublic = RETIREMENT_PUBLIC.some((p) => pathname.startsWith(p));
    if (isPublic) return NextResponse.next();

    const session = request.cookies.get(RETIREMENT_SESSION_COOKIE);
    let isValid = false;
    if (session?.value && session.value !== "logged_out") {
      try {
        const parsed = JSON.parse(session.value);
        isValid = !!(parsed?.id && parsed?.role);
      } catch {
        isValid = false;
      }
    }
    if (!isValid) {
      const loginUrl = new URL("/retirement/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── TempStaff portal ───────────────────────────────────────────────────────
  const isTempstaffPublic = TEMPSTAFF_PUBLIC.some((p) => pathname.startsWith(p));
  if (isTempstaffPublic) return NextResponse.next();

  const session = request.cookies.get(TEMPSTAFF_SESSION_COOKIE);
  if (session?.value !== TEMPSTAFF_SESSION_VALUE) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/staff/:path*",
    "/deductions/:path*",
    "/history/:path*",
    "/audit-logs/:path*",
    "/import/:path*",
    "/export/:path*",
    "/payslip/:path*",
    "/retirement/:path*",
  ],
};
