import { NextRequest, NextResponse } from 'next/server';
import { db, announcements, auditLogs } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const list = await db.query.announcements.findMany({
      orderBy: [desc(announcements.createdAt)],
    });
    return NextResponse.json({ announcements: list });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, priority, active } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const announcement = db
      .insert(announcements)
      .values({
        title,
        content,
        priority: priority || 'INFO',
        active: active !== undefined ? active : true,
        author: session.name || 'HR Administration',
      })
      .returning()
      .get();

    db.insert(auditLogs)
      .values({
        actorId: session.id,
        action: 'ANNOUNCEMENT_CREATED',
        targetType: 'SYSTEM',
        targetId: announcement.id,
        metadata: JSON.stringify({ title, priority }),
      })
      .run();

    return NextResponse.json({ announcement, message: 'Announcement published successfully' });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to publish announcement' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    }

    db.delete(announcements).where(eq(announcements.id, id)).run();

    return NextResponse.json({ message: 'Announcement removed' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
