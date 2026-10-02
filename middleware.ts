import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TEMPSTAFF_SESSION_COOKIE = "staff_admin_session";
const TEMPSTAFF_SESSION_VALUE = "authenticated_admin_active";
const RETIREMENT_SESSION_COOKIE = "dvla_retirement_session";
const ADMIN_SESSION_COOKIE = "dvla_super_admin_session";
const HRLETTERS_SESSION_COOKIE = "dvla_hrletters_session";

// Public paths that never need auth
const TEMPSTAFF_PUBLIC = ["/login", "/api/auth"];
const RETIREMENT_PUBLIC = ["/retirement/login", "/api/retirement/auth"];
const ADMIN_PUBLIC = ["/admin/login", "/api/admin/auth"];
const HR_LETTERS_PUBLIC = ["/hrletters/login", "/api/hrletters/auth"];

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

  // ── HR Letters portal ─────────────────────────────────────────────────────
  if (pathname.startsWith("/hrletters")) {
    const isPublic = HR_LETTERS_PUBLIC.some((p) => pathname.startsWith(p));
    if (isPublic) return NextResponse.next();

    const session = request.cookies.get(HRLETTERS_SESSION_COOKIE);
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
      const loginUrl = new URL("/hrletters/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── TempStaff portal ───────────────────────────────────────────────────────
  const isTempstaffPublic = TEMPSTAFF_PUBLIC.some((p) => pathname.startsWith(p));
  if (isTempstaffPublic) return NextResponse.next();

  const session = request.cookies.get(TEMPSTAFF_SESSION_COOKIE);
  let isTempstaffValid = false;
  let userRole = "HR Officer";

  if (session?.value && session.value !== "logged_out") {
    if (session.value === TEMPSTAFF_SESSION_VALUE) {
      isTempstaffValid = true;
      userRole = "HR Manager";
    } else {
      try {
        const parsed = JSON.parse(session.value);
        isTempstaffValid = !!(parsed?.username || parsed?.name || parsed?.email);
        if (parsed?.role) {
          userRole = parsed.role;
        }
      } catch {
        isTempstaffValid = false;
      }
    }
  }

  if (!isTempstaffValid) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role Access Guard: Validation Officers cannot access /staff directory or management views
  const isRestrictedForValidationOfficer = [
    "/staff",
    "/deductions",
    "/history",
    "/audit-logs",
    "/import",
  ].some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (isRestrictedForValidationOfficer && userRole.toUpperCase().includes("VALIDAT")) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Role Access Guard: HR Officer cannot access management/financial views
  const isRestrictedForOfficer = [
    "/deductions",
    "/payslip",
    "/history",
    "/audit-logs",
    "/import",
  ].some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (isRestrictedForOfficer && userRole === "HR Officer") {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
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
    "/hrletters/:path*",
  ],
};
