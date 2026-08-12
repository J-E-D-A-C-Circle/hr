import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || undefined;
    const targetType = searchParams.get('targetType') || undefined;
    const query = searchParams.get('q') || undefined;

    const where: any = {};
    if (action && action !== 'ALL') where.action = action;
    if (targetType && targetType !== 'ALL') where.targetType = targetType;
    if (query) {
      where.OR = [
        { action: { contains: query } },
        { targetType: { contains: query } },
        { metadata: { contains: query } },
        { actor: { name: { contains: query } } },
        { actor: { email: { contains: query } } },
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit log records' }, { status: 500 });
  }
}
