import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId') || undefined;

    // HR_ADMIN sees all branches (active or inactive); others see active branches only
    const isHrAdmin = session?.role === 'HR_ADMIN';
    const whereClause: any = {};
    if (!isHrAdmin) {
      whereClause.active = true;
    }
    if (regionId && regionId !== 'ALL') {
      whereClause.regionId = regionId;
    }

    const branches = await prisma.branch.findMany({
      where: whereClause,
      include: {
        region: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { name: 'asc' },
    });

    const regions = await prisma.region.findMany({ orderBy: { name: 'asc' } });

    return NextResponse.json({ branches, regions });
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
      branch = await prisma.branch.update({
        where: { id },
        data: { name, code: branchCode, regionId, headName, headEmail, active: active ?? true },
      });
    } else {
      branch = await prisma.branch.create({
        data: { name, code: branchCode, regionId, headName, headEmail, active: active ?? true },
      });
    }

    await logAuditAction({
      actorId: session.id,
      action: id ? 'BRANCH_UPDATE' : 'BRANCH_CREATE',
      targetType: 'BRANCH',
      targetId: branch.id,
      metadata: { name, code: branchCode, regionId },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    console.error('Error saving branch:', error);
    if (error.code === 'P2002') {
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
      await prisma.branch.deleteMany({});
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

    const deleted = await prisma.branch.delete({
      where: { id },
    });

    await logAuditAction({
      actorId: session.id,
      action: 'BRANCH_DELETE',
      targetType: 'BRANCH',
      targetId: id,
      metadata: { name: deleted.name },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
  }
}
