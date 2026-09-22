import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const HR_LETTERS_COOKIE = "dvla_hrletters_session";

export interface HrLetterSession {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export async function getHrLettersSession(): Promise<HrLetterSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(HR_LETTERS_COOKIE);
    if (!cookie?.value || cookie.value === "logged_out") return null;

    const parsed = JSON.parse(cookie.value);
    if (!parsed?.id || !parsed?.role) return null;

    return parsed as HrLetterSession;
  } catch {
    return null;
  }
}

export async function createHrLettersSession(user: {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}): Promise<void> {
  const cookieStore = await cookies();
  const sessionData: HrLetterSession = {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };

  cookieStore.set(HR_LETTERS_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: false, // Allow over HTTP server IP addresses (http://localhost:3002 or docker :8080)
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

export async function clearHrLettersSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(HR_LETTERS_COOKIE, "logged_out", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

