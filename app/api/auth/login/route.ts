import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, createAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const usernameOrEmail: string = (body?.usernameOrEmail || body?.username || body?.email || "").trim().toLowerCase();
    const password: string = (body?.password || "").trim();

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Username/email and password are required." },
        { status: 400 }
      );
    }

    let isValid = false;

    // 1. Check DB tempstaff_users table first
    try {
      const dbUser = await prisma.tempStaffUser.findFirst({
        where: {
          OR: [
            { username: usernameOrEmail },
            { email: usernameOrEmail },
          ],
        },
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
          isValid = true;
          // Update last login timestamp
          try {
            await prisma.tempStaffUser.update({
              where: { id: dbUser.id },
              data: { lastLoginAt: new Date() },
            });
          } catch {}
        }
      }
    } catch (dbErr) {
      console.warn("TempStaff DB check failed, using env fallback:", dbErr);
    }

    // 2. Fall back to env credentials check
    if (!isValid && checkCredentials(usernameOrEmail, password)) {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please try again." },
        { status: 401 }
      );
    }

    await createAdminSession();
    return NextResponse.json({ success: true, message: "Logged in successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
