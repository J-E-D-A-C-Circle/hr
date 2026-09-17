import { NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { db, users } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { logAuditAction } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const role = searchParams.get('role') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const conditions: any[] = [];
    if (role && role !== 'ALL') conditions.push(eq(users.role, role));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let userList = await db.query.users.findMany({
      where: whereClause,
      with: {
        branch: { columns: { id: true, name: true, code: true } },
        region: { columns: { id: true, name: true } },
      },
      orderBy: [desc(users.createdAt)],
    });

    if (query) {
      const qLower = query.toLowerCase();
      userList = userList.filter(
        (u: any) =>
          u.name.toLowerCase().includes(qLower) ||
          u.email.toLowerCase().includes(qLower) ||
          u.branch?.name.toLowerCase().includes(qLower)
      );
    }

    const totalCount = userList.length;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = limit > 0 ? userList.slice(startIndex, startIndex + limit) : userList;

    const sanitizedUsers = paginatedUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      branchId: u.branchId,
      regionId: u.regionId,
      active: u.active,
      createdAt: u.createdAt,
      branch: u.branch,
      region: u.region,
    }));

    return NextResponse.json({
      users: sanitizedUsers,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
      },
    });
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
        updatedAt: new Date().toISOString(),
      };
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }

      db.update(users).set(updateData).where(eq(users.id, id)).run();
      user = await db.query.users.findFirst({ where: eq(users.id, id) });
    } else {
      if (!password) {
        return NextResponse.json({ error: 'Password is required for new user creation' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      user = db
        .insert(users)
        .values({
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          role,
          branchId: branchId || null,
          regionId: regionId || null,
          active: active ?? true,
        })
        .returning()
        .get();
    }

    await logAuditAction({
      actorId: session.id,
      action: id ? 'USER_UPDATE' : 'USER_CREATE',
      targetType: 'USER',
      targetId: user?.id,
      metadata: { name, email, role, branchId },
    });

    return NextResponse.json({
      success: true,
      user: { id: user?.id, name: user?.name, email: user?.email, role: user?.role },
    });
  } catch (error: any) {
    console.error('Error saving user:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'A user with this email address already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save user account' }, { status: 500 });
  }
}
