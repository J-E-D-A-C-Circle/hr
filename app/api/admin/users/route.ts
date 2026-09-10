import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch users from all three sources
    const [adminUsers, retirementUsers, tempStaffUsers] = await Promise.all([
      prisma.adminUser.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.retirementUser.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          active: true,
          lastLogin: true,
          created_at: true,
        },
      }),
      prisma.tempStaffUser.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
    ]);

    // Format into unified user model list
    const unifiedUsers = [
      ...adminUsers.map((u: any) => ({
        id: u.id,
        system: "SUPER_ADMIN",
        username: u.username,
        email: u.email,
        name: u.name,
        role: "Super Administrator",
        status: u.status,
        lastLogin: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
      ...retirementUsers.map((u: any) => ({
        id: String(u.id),
        system: "RETIREMENT",
        username: u.username,
        email: u.email,
        name: u.fullName,
        role: u.role,
        status: u.active ? "ACTIVE" : "SUSPENDED",
        lastLogin: u.lastLogin,
        createdAt: u.created_at,
      })),
      ...tempStaffUsers.map((u: any) => ({
        id: u.id,
        system: "TEMPSTAFF",
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        lastLogin: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
    ];

    return NextResponse.json({ success: true, users: unifiedUsers });
  } catch (error: any) {
    console.error("Admin Users GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { system, username, email, name, password, role } = body;

    if (!system || !username || !email || !name || !password) {
      return NextResponse.json(
        { error: "System, Username, Email, Name, and Password are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = `plain:${password.trim()}`;

    if (system === "SUPER_ADMIN") {
      const newUser = await prisma.adminUser.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          name,
          passwordHash,
          status: "ACTIVE",
        },
      });
      return NextResponse.json({ success: true, user: newUser });
    }

    if (system === "RETIREMENT") {
      const newUser = await prisma.retirementUser.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          fullName: name,
          passwordHash,
          role: role || "HR_OFFICER",
          active: true,
        },
      });
      return NextResponse.json({ success: true, user: newUser });
    }

    if (system === "TEMPSTAFF") {
      const newUser = await prisma.tempStaffUser.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          name,
          passwordHash,
          role: role || "HR Manager",
          status: "ACTIVE",
        },
      });
      return NextResponse.json({ success: true, user: newUser });
    }

    return NextResponse.json({ error: "Invalid system specified" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin User Create Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, system, action, status, newPassword, role, name, email } = body;

    if (!id || !system) {
      return NextResponse.json({ error: "User ID and System are required" }, { status: 400 });
    }

    // Toggle status action
    if (action === "TOGGLE_STATUS") {
      if (system === "SUPER_ADMIN") {
        const updated = await prisma.adminUser.update({
          where: { id },
          data: { status: status || "ACTIVE" },
        });
        return NextResponse.json({ success: true, user: updated });
      }

      if (system === "RETIREMENT") {
        const updated = await prisma.retirementUser.update({
          where: { id: Number(id) },
          data: { active: status === "ACTIVE" },
        });
        return NextResponse.json({ success: true, user: updated });
      }

      if (system === "TEMPSTAFF") {
        const updated = await prisma.tempStaffUser.update({
          where: { id },
          data: { status: status || "ACTIVE" },
        });
        return NextResponse.json({ success: true, user: updated });
      }
    }

    // Reset password action
    if (action === "RESET_PASSWORD") {
      if (!newPassword) {
        return NextResponse.json({ error: "New password is required" }, { status: 400 });
      }
      const hash = `plain:${newPassword.trim()}`;

      if (system === "SUPER_ADMIN") {
        await prisma.adminUser.update({
          where: { id },
          data: { passwordHash: hash },
        });
        return NextResponse.json({ success: true, message: "Admin password reset successfully" });
      }

      if (system === "RETIREMENT") {
        await prisma.retirementUser.update({
          where: { id: Number(id) },
          data: { passwordHash: hash },
        });
        return NextResponse.json({ success: true, message: "Retirement user password reset successfully" });
      }

      if (system === "TEMPSTAFF") {
        await prisma.tempStaffUser.update({
          where: { id },
          data: { passwordHash: hash },
        });
        return NextResponse.json({ success: true, message: "TempStaff user password reset successfully" });
      }
    }

    // General update
    if (action === "UPDATE_USER") {
      if (system === "SUPER_ADMIN") {
        const updated = await prisma.adminUser.update({
          where: { id },
          data: { name, email },
        });
        return NextResponse.json({ success: true, user: updated });
      }

      if (system === "RETIREMENT") {
        const updated = await prisma.retirementUser.update({
          where: { id: Number(id) },
          data: { fullName: name, email, role },
        });
        return NextResponse.json({ success: true, user: updated });
      }

      if (system === "TEMPSTAFF") {
        const updated = await prisma.tempStaffUser.update({
          where: { id },
          data: { name, email, role },
        });
        return NextResponse.json({ success: true, user: updated });
      }
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin User Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const system = searchParams.get("system");

    if (!id || !system) {
      return NextResponse.json({ error: "ID and System parameters are required" }, { status: 400 });
    }

    if (system === "SUPER_ADMIN") {
      if (id === session.id) {
        return NextResponse.json({ error: "You cannot delete your own admin account while logged in" }, { status: 400 });
      }
      await prisma.adminUser.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Admin user deleted" });
    }

    if (system === "RETIREMENT") {
      await prisma.retirementUser.delete({ where: { id: Number(id) } });
      return NextResponse.json({ success: true, message: "Retirement user deleted" });
    }

    if (system === "TEMPSTAFF") {
      await prisma.tempStaffUser.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "TempStaff user deleted" });
    }

    return NextResponse.json({ error: "Invalid system" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin User Delete Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
