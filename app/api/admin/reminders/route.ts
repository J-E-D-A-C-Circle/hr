import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, branches, submissions, deadlineConfigs } from '@/lib/db';
import { eq, and, inArray } from 'drizzle-orm';
import { logAuditAction } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const config = await db.query.deadlineConfigs.findFirst({ where: eq(deadlineConfigs.id, 'default') });
    const cutoffDay = config?.cutoffDayOfMonth || 21;

    const activeBranches = await db.query.branches.findMany({
      where: eq(branches.active, true),
      with: { region: true },
    });

    const existingSubmissions = await db.query.submissions.findMany({
      where: and(
        eq(submissions.month, currentMonth),
        eq(submissions.year, currentYear),
        inArray(submissions.status, ['APPROVED', 'PENDING'])
      ),
      columns: { branchId: true },
    });

    const submittedBranchIds = new Set(existingSubmissions.map((s: any) => s.branchId));
    const pendingReminderBranches = activeBranches.filter((b: any) => !submittedBranchIds.has(b.id));

    const isOverdue = now.getDate() > cutoffDay;
    let sentCount = 0;

    for (const branch of pendingReminderBranches) {
      await logAuditAction({
        actorId: session.id,
        action: isOverdue ? 'OVERDUE_NOTICE_SENT' : 'REMINDER_SENT',
        targetType: 'BRANCH',
        targetId: branch.id,
        metadata: {
          branchName: branch.name,
          headEmail: branch.headEmail,
          month: currentMonth,
          year: currentYear,
          cutoffDay,
          status: isOverdue ? 'OVERDUE' : 'REMINDER_T_MINUS_DAYS',
        },
      });
      sentCount++;
    }

    await logAuditAction({
      actorId: session.id,
      action: 'BULK_REMINDER_TRIGGER',
      targetType: 'SYSTEM',
      metadata: {
        targetBranchCount: pendingReminderBranches.length,
        isOverdue,
        month: currentMonth,
        year: currentYear,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Triggered automated notifications for ${sentCount} unsubmitted branches. (${isOverdue ? 'Overdue notices sent' : 'Pre-cutoff reminders sent'})`,
      sentCount,
      isOverdue,
      month: currentMonth,
      year: currentYear,
    });
  } catch (error) {
    console.error('Error triggering automated reminders:', error);
    return NextResponse.json({ error: 'Failed to dispatch reminder notifications' }, { status: 500 });
  }
}
