import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth";
import { clearRetirementSession } from "@/lib/retirement-auth";
import { clearHrLettersSession } from "@/lib/hrletters-auth";
import { clearAdminSession as clearTempStaffSession } from "@/lib/auth";

/**
 * Universal logout — clears ALL portal session cookies.
 * Called by any portal's logout button so cross-portal session bleed is impossible.
 */
export async function POST(req: Request) {
  try {
    await Promise.allSettled([
      clearAdminSession(),
      clearTempStaffSession(),
      clearRetirementSession(),
      clearHrLettersSession(),
    ]);

    const url = new URL(req.url);
    const redirectTo = url.searchParams.get("redirect") || "/";

    const res = NextResponse.json({ success: true, redirectTo });
    const cookieOpts = { httpOnly: true, secure: false, sameSite: "lax" as const, maxAge: 0, path: "/" };
    res.cookies.set("dvla_super_admin_session", "", cookieOpts);
    res.cookies.set("staff_admin_session", "", cookieOpts);
    res.cookies.set("dvla_retirement_session", "", cookieOpts);
    res.cookies.set("dvla_hrletters_session", "", cookieOpts);

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Logout failed" }, { status: 500 });
  }
}
