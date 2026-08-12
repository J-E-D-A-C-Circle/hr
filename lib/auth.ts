import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export type Role = 'STATION_MANAGER' | 'HR_ADMIN';

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'pvc-super-secret-jwt-key-2026-development';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string | null;
  regionId?: string | null;
  branchName?: string | null;
  regionName?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Simple crypto-signed payload for server session token
export function encryptSession(session: UserSession): string {
  const payloadStr = JSON.stringify({ ...session, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('hex');
  return Buffer.from(`${payloadStr}::${hmac}`).toString('base64');
}

export function decryptSession(token: string): UserSession | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('::');
    if (parts.length !== 2) return null;
    const [payloadStr, hmac] = parts;
    const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('hex');
    if (hmac !== expectedHmac) return null;
    const payload = JSON.parse(payloadStr);
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload as UserSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('pvc_session')?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function setSessionCookie(session: UserSession) {
  const cookieStore = await cookies();
  const token = encryptSession(session);
  cookieStore.set('pvc_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('pvc_session');
}
