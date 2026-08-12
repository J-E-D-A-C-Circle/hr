import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSessionCookie } from '@/lib/auth';
import { logAuditAction } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        branch: true,
        region: true,
      },
    });

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

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
