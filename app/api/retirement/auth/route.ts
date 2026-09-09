import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createRetirementSession, clearRetirementSession, getRetirementSession, verifyPassword } from "@/lib/retirement-auth";

export async function GET() {
  const session = await getRetirementSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: "Username/Email and password are required." }, { status: 400 });
    }

    const user = await prisma.retirementUser.findFirst({
      where: {
        OR: [
          { email: usernameOrEmail.trim().toLowerCase() },
          { username: usernameOrEmail.trim().toLowerCase() },
        ],
        active: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials or account deactivated." }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Update last login
    await prisma.retirementUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await createRetirementSession(user);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to authenticate." }, { status: 500 });
  }
}

export async function DELETE() {
  await clearRetirementSession();
  return NextResponse.json({ success: true, message: "Logged out successfully." });
}
