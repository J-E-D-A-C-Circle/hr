import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const ADMIN_SESSION_COOKIE = "dvla_super_admin_session";

export interface AdminSession {
  id: string;
  email: string;
  username: string;
  name: string;
  role: "SUPER_ADMIN";
}

/**
 * Verifies raw password against stored hash (plain: text or direct match)
 */
export function verifyAdminPassword(input: string, storedHash: string): boolean {
  if (storedHash.startsWith("plain:")) {
    return input === storedHash.replace("plain:", "");
  }
  return input === storedHash;
}

/**
 * Creates session cookie for authenticated Super Admin
 */
export async function createAdminSession(admin: {
  id: string;
  email: string;
  username: string;
  name: string;
}): Promise<void> {
  const cookieStore = await cookies();
  const sessionData: AdminSession = {
    id: admin.id,
    email: admin.email,
    username: admin.username,
    name: admin.name,
    role: "SUPER_ADMIN",
  };

  cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

/**
 * Retrieves current active admin session from cookie
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);
    if (!sessionCookie || !sessionCookie.value || sessionCookie.value === "logged_out") {
      return null;
    }
    return JSON.parse(sessionCookie.value) as AdminSession;
  } catch {
    return null;
  }
}

/**
 * Clears admin session cookie
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "logged_out", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Authenticates admin credentials against DB or fallback env credentials
 */
export async function authenticateAdmin(
  usernameOrEmail: string,
  passwordInput: string
) {
  const cleanInput = usernameOrEmail.trim().toLowerCase();

  // 1. Attempt DB search safely
  try {
    const existingAdmin = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { username: cleanInput },
          { email: cleanInput },
        ],
      },
    });

    if (existingAdmin) {
      if (existingAdmin.status === "SUSPENDED") {
        return { success: false, error: "Account is suspended. Contact system administrator." };
      }

      const isValid = verifyAdminPassword(passwordInput, existingAdmin.passwordHash);
      if (!isValid) {
        return { success: false, error: "Invalid username or password" };
      }

      // Update last login timestamp safely
      try {
        await prisma.adminUser.update({
          where: { id: existingAdmin.id },
          data: { lastLoginAt: new Date() },
        });
      } catch (err) {
        console.warn("Failed to update lastLoginAt for admin:", err);
      }

      return { success: true, admin: existingAdmin };
    }
  } catch (dbError) {
    console.warn("Admin DB query failed or table missing, falling back to ENV credentials:", dbError);
  }

  // 2. Fallback check using ENV variables or standard default admin credentials
  const envUsername = (process.env.SUPER_ADMIN_USERNAME || process.env.ADMIN_USERNAME || "hr.admin").toLowerCase();
  const envEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@dvla.gov.gh").toLowerCase();
  const envPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "admin123";

  if ((cleanInput === envUsername || cleanInput === envEmail) && passwordInput === envPassword) {
    let createdAdmin: any = null;
    try {
      createdAdmin = await prisma.adminUser.create({
        data: {
          username: envUsername,
          email: envEmail,
          name: "Super Administrator",
          passwordHash: `plain:${envPassword}`,
          status: "ACTIVE",
          lastLoginAt: new Date(),
        },
      });
    } catch (createErr) {
      console.warn("Could not insert default admin to DB, continuing with session:", createErr);
    }

    return {
      success: true,
      admin: createdAdmin || {
        id: "env-super-admin-id",
        username: envUsername,
        email: envEmail,
        name: "Super Administrator",
        role: "SUPER_ADMIN",
      },
    };
  }

  return { success: false, error: "Invalid admin credentials" };
}
