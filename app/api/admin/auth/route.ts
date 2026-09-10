import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, createAdminSession, getAdminSession, clearAdminSession } from "@/lib/admin-auth";

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

export async function DELETE() {
  try {
    await clearAdminSession();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Logout failed" }, { status: 500 });
  }
}
