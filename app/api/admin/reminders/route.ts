import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1 - 12
    const currentYear = now.getFullYear();

    const config = await prisma.deadlineConfig.findUnique({ where: { id: 'default' } });
    const cutoffDay = config?.cutoffDayOfMonth || 21;

    // Find all active branches
    const activeBranches = await prisma.branch.findMany({
      where: { active: true },
      include: { region: true },
    });

    // Find branches that already submitted for current month with status APPROVED or PENDING
    const existingSubmissions = await prisma.submission.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        status: { in: ['APPROVED', 'PENDING'] },
      },
      select: { branchId: true },
    });

    const submittedBranchIds = new Set(existingSubmissions.map((s) => s.branchId));

    const pendingReminderBranches = activeBranches.filter((b) => !submittedBranchIds.has(b.id));

    const isOverdue = now.getDate() > cutoffDay;

    let sentCount = 0;

    for (const branch of pendingReminderBranches) {
      // Log reminder action for each branch
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
