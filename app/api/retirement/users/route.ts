import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRetirementSession } from "@/lib/retirement-auth";

export async function GET() {
  try {
    const session = await getRetirementSession();
    if (!session || session.role !== "HR_ADMINISTRATOR") {
      return NextResponse.json({ error: "Unauthorized access. HR Administrator privileges required." }, { status: 403 });
    }

    const users = await prisma.retirementUser.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        active: true,
        lastLogin: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getRetirementSession();
    if (!session || session.role !== "HR_ADMINISTRATOR") {
      return NextResponse.json({ error: "Unauthorized access. HR Administrator privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { email, username, fullName, password, role } = body;

    if (!email || !username || !fullName || !password) {
      return NextResponse.json({ error: "Please provide email, username, full name, and password." }, { status: 400 });
    }

    const existingEmail = await prisma.retirementUser.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingEmail) {
      return NextResponse.json({ error: "User with this email already exists." }, { status: 400 });
    }

    const existingUsername = await prisma.retirementUser.findUnique({ where: { username: username.trim().toLowerCase() } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username is already taken." }, { status: 400 });
    }

    const newUser = await prisma.retirementUser.create({
      data: {
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        passwordHash: `plain:${password}`,
        role: role === "HR_ADMINISTRATOR" ? "HR_ADMINISTRATOR" : "HR_OFFICER",
        active: true,
      },
    });

    await prisma.retirementAuditLog.create({
      data: {
        userName: session.fullName,
        userRole: session.role,
        action: "CREATE_USER",
        details: `Created new HR user account '${newUser.fullName}' (${newUser.username}) with role ${newUser.role}.`,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        active: newUser.active,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getRetirementSession();
    if (!session || session.role !== "HR_ADMINISTRATOR") {
      return NextResponse.json({ error: "Unauthorized access. HR Administrator privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { id, fullName, role, active, password } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = Boolean(active);
    if (password) updateData.passwordHash = `plain:${password}`;

    const updatedUser = await prisma.retirementUser.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    await prisma.retirementAuditLog.create({
      data: {
        userName: session.fullName,
        userRole: session.role,
        action: "UPDATE_USER",
        details: `Updated HR user account '${updatedUser.fullName}' (${updatedUser.username}).`,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user." }, { status: 500 });
  }
}
