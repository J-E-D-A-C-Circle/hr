import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, submissions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logAuditAction } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. HR Admin permission required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reviewerNotes } = body;

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return NextResponse.json({ error: 'Action must be APPROVE or REJECT' }, { status: 400 });
    }

    if (action === 'REJECT' && (!reviewerNotes || !reviewerNotes.trim())) {
      return NextResponse.json({ error: 'Rejection requires a mandatory comment explaining what needs correction.' }, { status: 400 });
    }

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, id),
      with: { branch: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission document not found' }, { status: 404 });
    }

    const updatedStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    db.update(submissions)
      .set({
        status: updatedStatus,
        reviewerId: session.id,
        reviewerNotes: reviewerNotes ? reviewerNotes.trim() : null,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(submissions.id, id))
      .run();

    const updated = await db.query.submissions.findFirst({
      where: eq(submissions.id, id),
      with: {
        branch: { with: { region: true } },
        uploadedBy: { columns: { id: true, name: true, email: true } },
        reviewer: { columns: { id: true, name: true, email: true } },
      },
    });

    await logAuditAction({
      actorId: session.id,
      action: action === 'APPROVE' ? 'APPROVE' : 'REJECT',
      targetType: 'SUBMISSION',
      targetId: id,
      metadata: {
        branchName: submission.branch.name,
        month: submission.month,
        year: submission.year,
        reviewerNotes: reviewerNotes || null,
      },
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    return NextResponse.json({ error: 'Failed to process review action' }, { status: 500 });
  }
}
