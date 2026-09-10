import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const RETIREMENT_SESSION_COOKIE = "dvla_retirement_session";

export interface RetirementUserSession {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: "HR_ADMINISTRATOR" | "HR_OFFICER";
}

/**
 * Creates session cookie for authenticated user
 */
export async function createRetirementSession(user: {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: string;
}): Promise<void> {
  const cookieStore = await cookies();
  const sessionData: RetirementUserSession = {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    role: user.role === "HR_ADMINISTRATOR" ? "HR_ADMINISTRATOR" : "HR_OFFICER",
  };

  cookieStore.set(RETIREMENT_SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: false, // Allow over HTTP server IP addresses
    sameSite: "lax",
    maxAge: 60 * 60 * 12, // 12 hours
    path: "/",
  });
}

/**
 * Retrieves current active session from cookie
 */
export async function getRetirementSession(): Promise<RetirementUserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(RETIREMENT_SESSION_COOKIE);
    if (!sessionCookie || !sessionCookie.value || sessionCookie.value === "logged_out") {
      return null;
    }
    return JSON.parse(sessionCookie.value) as RetirementUserSession;
  } catch (error) {
    return null;
  }
}

/**
 * Clears session cookie
 */
export async function clearRetirementSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(RETIREMENT_SESSION_COOKIE, "logged_out", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}


/**
 * Simple password check (for demo seed accounts admin123 / officer123)
 */
export function verifyPassword(input: string, storedHash: string): boolean {
  if (storedHash.startsWith("plain:")) {
    return input === storedHash.replace("plain:", "");
  }
  return input === storedHash;
}
