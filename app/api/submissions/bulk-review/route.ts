import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, submissions } from '@/lib/db';
import { inArray } from 'drizzle-orm';
import { logAuditAction } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. HR Admin permission required.' }, { status: 403 });
    }

    const body = await request.json();
    const { submissionIds, action, reviewerNotes } = body;

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: 'Please select at least one submission to process.' }, { status: 400 });
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'Action must be APPROVE or REJECT' }, { status: 400 });
    }

    if (action === 'REJECT' && (!reviewerNotes || !reviewerNotes.trim())) {
      return NextResponse.json({ error: 'Bulk rejection requires a note explaining required corrections.' }, { status: 400 });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    db.update(submissions)
      .set({
        status: newStatus,
        reviewerId: session.id,
        reviewerNotes: reviewerNotes ? reviewerNotes.trim() : null,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(inArray(submissions.id, submissionIds))
      .run();

    const count = submissionIds.length;

    await logAuditAction({
      actorId: session.id,
      action: action === 'APPROVE' ? 'BULK_APPROVE' : 'BULK_REJECT',
      targetType: 'SUBMISSION',
      metadata: {
        count,
        submissionIds,
        reviewerNotes: reviewerNotes || null,
      },
    });

    return NextResponse.json({
      success: true,
      count,
      message: `Successfully ${action === 'APPROVE' ? 'approved' : 'rejected'} ${count} submission(s).`,
    });
  } catch (error) {
    console.error('Error executing bulk review:', error);
    return NextResponse.json({ error: 'Failed to process bulk review action' }, { status: 500 });
  }
}
