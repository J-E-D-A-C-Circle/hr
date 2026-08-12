import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId') || undefined;

    const branches = await prisma.branch.findMany({
      where: regionId && regionId !== 'ALL' ? { regionId } : {},
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

    if (!name || !code || !regionId || !headName || !headEmail) {
      return NextResponse.json({ error: 'Name, code, region, head name, and head email are required' }, { status: 400 });
    }

    let branch;
    if (id) {
      branch = await prisma.branch.update({
        where: { id },
        data: { name, code, regionId, headName, headEmail, active: active ?? true },
      });
    } else {
      branch = await prisma.branch.create({
        data: { name, code, regionId, headName, headEmail, active: active ?? true },
      });
    }

    await logAuditAction({
      actorId: session.id,
      action: id ? 'BRANCH_UPDATE' : 'BRANCH_CREATE',
      targetType: 'BRANCH',
      targetId: branch.id,
      metadata: { name, code, regionId },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    console.error('Error saving branch:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A branch with this code or name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save branch' }, { status: 500 });
  }
}
