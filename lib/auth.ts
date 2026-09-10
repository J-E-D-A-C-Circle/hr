import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "staff_admin_session";
const ADMIN_SESSION_VALUE = "authenticated_admin_active";

// Credentials configured via environment variables
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "hr.admin";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dvla.gov.gh";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_SESSION_COOKIE);
    return session?.value === ADMIN_SESSION_VALUE;
  } catch {
    return false;
  }
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, ADMIN_SESSION_VALUE, {
    httpOnly: true,
    secure: false, // Allow over HTTP server IP addresses
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function checkCredentials(usernameOrEmail: string, password: string): boolean {
  const identifier = usernameOrEmail.trim().toLowerCase();
  const isValidUser =
    identifier === ADMIN_USERNAME.toLowerCase() ||
    identifier === ADMIN_EMAIL.toLowerCase();
  return isValidUser && password === ADMIN_PASSWORD;
}
