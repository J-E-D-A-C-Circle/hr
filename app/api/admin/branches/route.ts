import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, branches, regions } from '@/lib/db';
import { eq, and, asc } from 'drizzle-orm';
import { logAuditAction } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId') || undefined;

    const isHrAdmin = session?.role === 'HR_ADMIN';
    const conditions: any[] = [];
    if (!isHrAdmin) {
      conditions.push(eq(branches.active, true));
    }
    if (regionId && regionId !== 'ALL') {
      conditions.push(eq(branches.regionId, regionId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const branchList = await db.query.branches.findMany({
      where: whereClause,
      with: {
        region: true,
        submissions: true,
      },
      orderBy: [asc(branches.name)],
    });

    const formattedBranches = branchList.map((b: any) => ({
      ...b,
      _count: { submissions: b.submissions ? b.submissions.length : 0 },
    }));

    const regionList = await db.query.regions.findMany({ orderBy: [asc(regions.name)] });

    return NextResponse.json({ branches: formattedBranches, regions: regionList });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, code, regionId, headName, headEmail, active } = body;

    if (!name || !regionId || !headName || !headEmail) {
      return NextResponse.json({ error: 'Name, region, head name, and head email are required' }, { status: 400 });
    }

    const branchCode = code && code.trim() ? code.trim() : null;

    let branch;
    if (id) {
      db.update(branches)
        .set({
          name,
          code: branchCode,
          regionId,
          headName,
          headEmail,
          active: active ?? true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(branches.id, id))
        .run();
      branch = await db.query.branches.findFirst({ where: eq(branches.id, id) });
    } else {
      branch = db
        .insert(branches)
        .values({ name, code: branchCode, regionId, headName, headEmail, active: active ?? true })
        .returning()
        .get();
    }

    await logAuditAction({
      actorId: session.id,
      action: id ? 'BRANCH_UPDATE' : 'BRANCH_CREATE',
      targetType: 'BRANCH',
      targetId: branch?.id,
      metadata: { name, code: branchCode, regionId },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    console.error('Error saving branch:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'A station branch with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save branch' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('deleteAll');

    if (deleteAll === 'true') {
      db.delete(branches).run();
      await logAuditAction({
        actorId: session.id,
        action: 'BRANCH_DELETE_ALL',
        targetType: 'BRANCH',
        metadata: { message: 'Deleted all station branches' },
      });
      return NextResponse.json({ success: true, message: 'All station branches deleted successfully' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Station ID is required' }, { status: 400 });
    }

    const targetBranch = await db.query.branches.findFirst({ where: eq(branches.id, id) });
    db.delete(branches).where(eq(branches.id, id)).run();

    await logAuditAction({
      actorId: session.id,
      action: 'BRANCH_DELETE',
      targetType: 'BRANCH',
      targetId: id,
      metadata: { name: targetBranch?.name || 'Unknown' },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
  }
}
