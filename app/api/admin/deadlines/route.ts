import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, deadlineConfigs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logAuditAction } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let config = db.select().from(deadlineConfigs).where(eq(deadlineConfigs.id, 'default')).get();
    if (!config) {
      config = db
        .insert(deadlineConfigs)
        .values({ id: 'default', cutoffDayOfMonth: 21, reminderDaysBefore: 3 })
        .returning()
        .get();
    }

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

    let config = db.select().from(deadlineConfigs).where(eq(deadlineConfigs.id, 'default')).get();
    if (config) {
      db.update(deadlineConfigs)
        .set({ cutoffDayOfMonth: cutoff, reminderDaysBefore: reminder, updatedAt: new Date().toISOString() })
        .where(eq(deadlineConfigs.id, 'default'))
        .run();
      config = db.select().from(deadlineConfigs).where(eq(deadlineConfigs.id, 'default')).get();
    } else {
      config = db
        .insert(deadlineConfigs)
        .values({ id: 'default', cutoffDayOfMonth: cutoff, reminderDaysBefore: reminder })
        .returning()
        .get();
    }

    await logAuditAction({
      actorId: session.id,
      action: 'DEADLINE_UPDATE',
      targetType: 'SYSTEM',
      metadata: { cutoffDayOfMonth: cutoff, reminderDaysBefore: reminder },
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error updating deadline config:', error);
    return NextResponse.json({ error: 'Failed to save deadline settings' }, { status: 500 });
  }
}
