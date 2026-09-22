import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const HR_LETTERS_COOKIE = "dvla_hrletters_session";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.hrLetterUser.findFirst({
      where: {
        OR: [
          { username: username.trim().toLowerCase() },
          { email: username.trim().toLowerCase() },
        ],
        active: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Password check (plain: prefix pattern consistent with other portals)
    const expectedHash = `plain:${password.trim()}`;
    if (user.passwordHash !== expectedHash) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.hrLetterUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const sessionPayload = JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
    });

    response.cookies.set(HR_LETTERS_COOKIE, sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("HR Letters Login Error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
