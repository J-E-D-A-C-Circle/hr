import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.deadlineConfig.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default', cutoffDayOfMonth: 21, reminderDaysBefore: 3 },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching deadline config:', error);
    return NextResponse.json({ error: 'Failed to fetch deadline settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { cutoffDayOfMonth, reminderDaysBefore } = body;

    const cutoff = parseInt(cutoffDayOfMonth);
    const reminder = parseInt(reminderDaysBefore);

    if (isNaN(cutoff) || cutoff < 1 || cutoff > 31) {
      return NextResponse.json({ error: 'Cutoff day must be between 1 and 31' }, { status: 400 });
    }

    if (isNaN(reminder) || reminder < 1 || reminder > 15) {
      return NextResponse.json({ error: 'Reminder lead days must be between 1 and 15' }, { status: 400 });
    }

    const updated = await prisma.deadlineConfig.upsert({
      where: { id: 'default' },
      update: { cutoffDayOfMonth: cutoff, reminderDaysBefore: reminder },
      create: { id: 'default', cutoffDayOfMonth: cutoff, reminderDaysBefore: reminder },
    });

    await logAuditAction({
      actorId: session.id,
      action: 'DEADLINE_UPDATE',
      targetType: 'SYSTEM',
      metadata: { cutoffDayOfMonth: cutoff, reminderDaysBefore: reminder },
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error('Error updating deadline config:', error);
    return NextResponse.json({ error: 'Failed to save deadline settings' }, { status: 500 });
  }
}
