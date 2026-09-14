import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "staff_admin_session";
const LEGACY_ADMIN_SESSION_VALUE = "authenticated_admin_active";

export interface TempStaffUserSession {
  id?: string;
  username: string;
  name: string;
  email: string;
  role: string;
}

// Credentials configured via environment variables
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "hr.officer";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dvla.gov.gh";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function getAdminSession(): Promise<TempStaffUserSession | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_SESSION_COOKIE);
    if (!session || !session.value || session.value === "logged_out") return null;

    try {
      const parsed = JSON.parse(session.value);
      if (parsed && typeof parsed === "object" && (parsed.username || parsed.name)) {
        return {
          id: parsed.id,
          username: parsed.username || "hr.officer",
          name: parsed.name || parsed.username || "HR Officer",
          email: parsed.email || "admin@dvla.gov.gh",
          role: "HR Officer",
        };
      }
    } catch {
      if (session.value === LEGACY_ADMIN_SESSION_VALUE) {
        return {
          username: "hr.officer",
          name: "HR Officer",
          email: "admin@dvla.gov.gh",
          role: "HR Officer",
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyAdminSession(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}

export async function createAdminSession(userData?: Partial<TempStaffUserSession>): Promise<void> {
  const cookieStore = await cookies();
  const sessionData: TempStaffUserSession = {
    id: userData?.id,
    username: userData?.username || "hr.officer",
    name: userData?.name || userData?.username || "HR Officer",
    email: userData?.email || "admin@dvla.gov.gh",
    role: "HR Officer",
  };

  cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(sessionData), {
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
    identifier === "hr.admin" ||
    identifier === "admin" ||
    identifier === ADMIN_EMAIL.toLowerCase();
  return isValidUser && password === ADMIN_PASSWORD;
}

