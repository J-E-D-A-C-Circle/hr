import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, auditLogs } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

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

    const conditions: any[] = [];
    if (action && action !== 'ALL') conditions.push(eq(auditLogs.action, action));
    if (targetType && targetType !== 'ALL') conditions.push(eq(auditLogs.targetType, targetType));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let logs = await db.query.auditLogs.findMany({
      where: whereClause,
      with: {
        actor: { columns: { id: true, name: true, email: true, role: true } },
      },
      orderBy: [desc(auditLogs.timestamp)],
      limit: 200,
    });

    if (query) {
      const qLower = query.toLowerCase();
      logs = logs.filter(
        (log: any) =>
          log.action.toLowerCase().includes(qLower) ||
          log.targetType.toLowerCase().includes(qLower) ||
          log.metadata?.toLowerCase().includes(qLower) ||
          log.actor?.name.toLowerCase().includes(qLower) ||
          log.actor?.email.toLowerCase().includes(qLower)
      );
    }

    return NextResponse.json({ auditLogs: logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit log records' }, { status: 500 });
  }
}
