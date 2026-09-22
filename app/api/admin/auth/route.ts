import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateAdmin, createAdminSession, getAdminSession, clearAdminSession } from "@/lib/admin-auth";
import { clearRetirementSession } from "@/lib/retirement-auth";
import { clearHrLettersSession } from "@/lib/hrletters-auth";
import { clearAdminSession as clearTempStaffSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user: session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to check session" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Username/Email and Password are required" },
        { status: 400 }
      );
    }

    const authResult = await authenticateAdmin(usernameOrEmail, password);
    if (!authResult.success || !authResult.admin) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Invalid credentials" },
        { status: 401 }
      );
    }

    await createAdminSession({
      id: authResult.admin.id,
      email: authResult.admin.email,
      username: authResult.admin.username,
      name: authResult.admin.name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: authResult.admin.id,
        email: authResult.admin.email,
        username: authResult.admin.username,
        name: authResult.admin.name,
        role: "SUPER_ADMIN",
      },
    });
  } catch (error: any) {
    console.error("Admin Auth Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE — clears ALL portal sessions so cache doesn't bleed across portals
export async function DELETE() {
  try {
    // Clear every portal session cookie at once
    await Promise.allSettled([
      clearAdminSession(),        // /admin
      clearTempStaffSession(),    // /dashboard
      clearRetirementSession(),   // /retirement
      clearHrLettersSession(),    // /hrletters
    ]);

    // Build response with explicit cookie expiration headers as a safety net
    const res = NextResponse.json({ success: true, message: "Logged out from all portals" });
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
