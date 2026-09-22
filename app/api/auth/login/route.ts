import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAdminSession as createTempStaffSession, checkCredentials as checkTempStaffEnvCredentials } from "@/lib/auth";
import { createRetirementSession, verifyPassword as verifyRetirementPassword } from "@/lib/retirement-auth";
import { createHrLettersSession } from "@/lib/hrletters-auth";
import { createAdminSession as createSuperAdminSession, verifyAdminPassword, authenticateAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const system: string = (body?.system || "TEMPSTAFF").toUpperCase();
    const usernameOrEmail: string = (body?.usernameOrEmail || body?.username || body?.email || "").trim().toLowerCase();
    const password: string = (body?.password || "").trim();

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Username/email and password are required." },
        { status: 400 }
      );
    }

    // 1. First check if Super Admin
    let isSuperAdmin = false;
    let superAdminObj: any = null;

    try {
      const adminAuth = await authenticateAdmin(usernameOrEmail, password);
      if (adminAuth.success && adminAuth.admin) {
        isSuperAdmin = true;
        superAdminObj = adminAuth.admin;
      }
    } catch (adminErr) {
      console.warn("Super Admin check error:", adminErr);
    }

    if (isSuperAdmin && superAdminObj) {
      // Super Admin has global access across all portals!
      if (system === "SUPER_ADMIN") {
        await createSuperAdminSession(superAdminObj);
        return NextResponse.json({
          success: true,
          redirectUrl: "/admin/dashboard",
          message: "Logged in as Super Admin",
          system: "SUPER_ADMIN",
        });
      } else if (system === "RETIREMENT") {
        await createRetirementSession({
          id: 9999,
          email: superAdminObj.email,
          username: superAdminObj.username,
          fullName: superAdminObj.name || "Super Administrator",
          role: "HR_ADMINISTRATOR",
        });
        return NextResponse.json({
          success: true,
          redirectUrl: "/retirement",
          message: "Logged in to Retirement Portal as Super Admin",
          system: "RETIREMENT",
        });
      } else if (system === "HR_LETTERS") {
        await createHrLettersSession({
          id: superAdminObj.id || "super-admin",
          username: superAdminObj.username,
          email: superAdminObj.email,
          fullName: superAdminObj.name || "Super Administrator",
          role: "HR_DIRECTOR",
        });
        return NextResponse.json({
          success: true,
          redirectUrl: "/hrletters",
          message: "Logged in to HR Letters Portal as Super Admin",
          system: "HR_LETTERS",
        });
      } else {
        // TEMPSTAFF
        await createTempStaffSession({
          id: superAdminObj.id,
          username: superAdminObj.username,
          name: superAdminObj.name,
          email: superAdminObj.email,
          role: "Super Administrator",
        });
        return NextResponse.json({
          success: true,
          redirectUrl: "/dashboard",
          message: "Logged in to TempStaff Portal as Super Admin",
          system: "TEMPSTAFF",
        });
      }
    }

    // 2. If NOT Super Admin, check specific system access requirement
    if (system === "SUPER_ADMIN") {
      // User tried logging into Super Admin without Super Admin credentials
      const inTempStaff = await prisma.tempStaffUser.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
      const inRetirement = await prisma.retirementUser.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
      const inHrLetters = await prisma.hrLetterUser.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });

      if (inTempStaff || inRetirement || inHrLetters) {
        return NextResponse.json(
          {
            success: false,
            error: "Access Denied: Your account does not have Super Administrator privileges. Please select your assigned system interface from the dropdown.",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Invalid Super Admin credentials." },
        { status: 401 }
      );
    }

    if (system === "TEMPSTAFF") {
      const dbUser = await prisma.tempStaffUser.findFirst({
        where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
      });

      if (dbUser) {
        if (dbUser.status === "SUSPENDED") {
          return NextResponse.json(
            { success: false, error: "Account is suspended. Contact HR Administrator." },
            { status: 403 }
          );
        }

        const matchHash = dbUser.passwordHash.startsWith("plain:")
          ? password === dbUser.passwordHash.replace("plain:", "")
          : password === dbUser.passwordHash;

        if (matchHash) {
          await prisma.tempStaffUser.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date() },
          }).catch(() => {});

          await createTempStaffSession({
            id: dbUser.id,
            username: dbUser.username,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role || "HR Officer",
          });

          return NextResponse.json({
            success: true,
            redirectUrl: "/dashboard",
            message: "Logged in successfully",
            system: "TEMPSTAFF",
          });
        }
      } else if (checkTempStaffEnvCredentials(usernameOrEmail, password)) {
        await createTempStaffSession({
          username: usernameOrEmail,
          name: "HR Officer",
          email: usernameOrEmail.includes("@") ? usernameOrEmail : "admin@dvla.gov.gh",
          role: "HR Officer",
        });
        return NextResponse.json({
          success: true,
          redirectUrl: "/dashboard",
          message: "Logged in successfully",
          system: "TEMPSTAFF",
        });
      }

      // If user wasn't verified for TempStaff, check if they belong to another system
      const inRetirement = await prisma.retirementUser.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
      const inHrLetters = await prisma.hrLetterUser.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });

      if (inRetirement) {
        return NextResponse.json(
          {
            success: false,
            error: "Access Denied: Your account is associated with the Retirement Tracking System. Please select 'Retirement Tracking System' from the system dropdown above.",
          },
          { status: 403 }
        );
      }
      if (inHrLetters) {
        return NextResponse.json(
          {
            success: false,
            error: "Access Denied: Your account is associated with the HR Letters System. Please select 'HR Letters & Appointment System' from the system dropdown above.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please check your username/email and password." },
        { status: 401 }
      );
    }

    if (system === "RETIREMENT") {
      const user = await prisma.retirementUser.findFirst({
        where: { OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }] },
      });

      if (user) {
        if (!user.active) {
          return NextResponse.json(
            { success: false, error: "Account is deactivated. Contact HR Administrator." },
            { status: 403 }
          );
        }

        const isValid = verifyRetirementPassword(password, user.passwordHash);
        if (isValid) {
          await prisma.retirementUser.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          }).catch(() => {});

          await createRetirementSession(user);

          return NextResponse.json({
            success: true,
            redirectUrl: "/retirement",
            message: "Logged in successfully",
            system: "RETIREMENT",
          });
        }
      }

      // If user wasn't verified for Retirement, check if they belong to another system
      const inTempStaff = await prisma.tempStaffUser.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
      const inHrLetters = await prisma.hrLetterUser.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });

      if (inTempStaff) {
        return NextResponse.json(
          {
            success: false,
            error: "Access Denied: Your account is associated with the TempStaff Management Portal. Please select 'TempStaff Management Portal' from the system dropdown above.",
          },
          { status: 403 }
        );
      }
      if (inHrLetters) {
        return NextResponse.json(
          {
            success: false,
            error: "Access Denied: Your account is associated with the HR Letters System. Please select 'HR Letters & Appointment System' from the system dropdown above.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please check your username/email and password." },
        { status: 401 }
      );
    }

    if (system === "HR_LETTERS") {
      const user = await prisma.hrLetterUser.findFirst({
        where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
      });

      if (user) {
        if (!user.active) {
          return NextResponse.json(
            { success: false, error: "Account is deactivated. Contact HR Administrator." },
            { status: 403 }
          );
        }

        const expectedHash = user.passwordHash.startsWith("plain:")
          ? `plain:${password}`
          : password;
        
        const match = user.passwordHash === expectedHash || (user.passwordHash.startsWith("plain:") && user.passwordHash.replace("plain:", "") === password);

        if (match) {
          await prisma.hrLetterUser.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          }).catch(() => {});

          await createHrLettersSession({
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          });

          return NextResponse.json({
            success: true,
            redirectUrl: "/hrletters",
            message: "Logged in successfully",
            system: "HR_LETTERS",
          });
        }
      }

      // If user wasn't verified for HR Letters, check if they belong to another system
      const inTempStaff = await prisma.tempStaffUser.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
      const inRetirement = await prisma.retirementUser.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });

      if (inTempStaff) {
        return NextResponse.json(
          {
            success: false,
            error: "Access Denied: Your account is associated with the TempStaff Management Portal. Please select 'TempStaff Management Portal' from the system dropdown above.",
          },
          { status: 403 }
        );
      }
      if (inRetirement) {
        return NextResponse.json(
          {
            success: false,
            error: "Access Denied: Your account is associated with the Retirement Tracking System. Please select 'Retirement Tracking System' from the system dropdown above.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please check your username/email and password." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid target system interface selected." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Unified Login Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected login error occurred." },
      { status: 500 }
    );
  }
}
