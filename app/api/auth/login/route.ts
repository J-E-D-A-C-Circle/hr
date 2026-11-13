import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyPassword, setSessionCookie } from '@/lib/auth';
import { logAuditAction } from '@/lib/audit';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

function getRateLimitKey(request: Request, email: string): string {
  const forwardedFor = request.headers.get('x-forwarded-for') || 'local';
  const clientIp = forwardedFor.split(',')[0].trim();
  return `${clientIp}::${email.toLowerCase().trim()}`;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const existing = loginAttempts.get(key);
  if (!existing || now > existing.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOCKOUT_WINDOW_MS });
    return;
  }
  existing.count += 1;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const rateKey = getRateLimitKey(request, email);
    const now = Date.now();
    const attempt = loginAttempts.get(rateKey);
    if (attempt && now <= attempt.resetAt && attempt.count >= MAX_FAILED_ATTEMPTS) {
      const retryMinutes = Math.ceil((attempt.resetAt - now) / 60000);
      return NextResponse.json(
        { error: `Too many failed login attempts. Please try again in ${retryMinutes} minute(s).` },
        { status: 429 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
      with: {
        branch: true,
        region: true,
      },
    });

    if (!user || !user.active) {
      recordFailedAttempt(rateKey);
      return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      recordFailedAttempt(rateKey);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    loginAttempts.delete(rateKey);

    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      branchId: user.branchId,
      regionId: user.regionId,
      branchName: user.branch?.name || null,
      regionName: user.region?.name || null,
    };

    await setSessionCookie(sessionData);

    await logAuditAction({
      actorId: user.id,
      action: 'LOGIN',
      targetType: 'USER',
      targetId: user.id,
      metadata: { role: user.role, ip: request.headers.get('x-forwarded-for') || 'local' },
    });

    return NextResponse.json({ success: true, user: sessionData });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected server error occurred' }, { status: 500 });
  }
}
