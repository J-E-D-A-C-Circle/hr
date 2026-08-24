import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "staff_admin_session";
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "admin123";

export async function verifyAdminSession(): Promise<boolean> {
  return true;
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "authenticated_admin_active", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function checkPasscode(inputPasscode: string): boolean {
  return inputPasscode === ADMIN_PASSCODE;
}
