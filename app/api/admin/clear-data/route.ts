import { NextRequest, NextResponse } from 'next/server';
import { db, submissions, auditLogs, users, branches, announcements } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode } = await req.json();

    if (mode === 'SUBMISSIONS_ONLY') {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        for (const file of files) {
          if (file !== '.gitkeep') {
            try {
              fs.unlinkSync(path.join(uploadDir, file));
            } catch (e) {}
          }
        }
      }
      db.delete(submissions).run();
      db.insert(auditLogs)
        .values({
          actorId: session.id,
          action: 'CLEAR_DATA_SUBMISSIONS',
          targetType: 'SYSTEM',
          metadata: JSON.stringify({ mode }),
        })
        .run();
      return NextResponse.json({ message: 'All test submissions and uploaded PDF files cleared successfully.' });
    }

    if (mode === 'FULL_RESET') {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        for (const file of files) {
          if (file !== '.gitkeep') {
            try {
              fs.unlinkSync(path.join(uploadDir, file));
            } catch (e) {}
          }
        }
      }
      db.delete(submissions).run();
      db.delete(auditLogs).run();
      db.delete(users).where(eq(users.role, 'STATION_MANAGER')).run();
      db.delete(branches).run();
      db.delete(announcements).run();

      db.insert(auditLogs)
        .values({
          actorId: session.id,
          action: 'CLEAR_DATA_FULL_RESET',
          targetType: 'SYSTEM',
          metadata: JSON.stringify({ mode }),
        })
        .run();

      return NextResponse.json({ message: 'Database reset completed. All test stations, manager accounts, and submissions cleared.' });
    }

    return NextResponse.json({ error: 'Invalid reset mode specified' }, { status: 400 });
  } catch (error) {
    console.error('Error executing clear data:', error);
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
  }
}
