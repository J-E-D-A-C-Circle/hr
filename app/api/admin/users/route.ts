import { NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        regionId: true,
        active: true,
        createdAt: true,
        branch: { select: { id: true, name: true, code: true } },
        region: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch user list' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, password, role, branchId, regionId, active } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    let user;
    if (id) {
      const updateData: any = {
        name,
        email: email.toLowerCase().trim(),
        role,
        branchId: branchId || null,
        regionId: regionId || null,
        active: active ?? true,
      };
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }

      user = await prisma.user.update({
        where: { id },
        data: updateData,
      });
    } else {
      if (!password) {
        return NextResponse.json({ error: 'Password is required for new user creation' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          role,
          branchId: branchId || null,
          regionId: regionId || null,
          active: active ?? true,
        },
      });
    }

    await logAuditAction({
      actorId: session.id,
      action: id ? 'USER_UPDATE' : 'USER_CREATE',
      targetType: 'USER',
      targetId: user.id,
      metadata: { name, email, role, branchId },
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    console.error('Error saving user:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A user with this email address already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save user account' }, { status: 500 });
  }
}
