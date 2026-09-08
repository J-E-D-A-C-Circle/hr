import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

    // Batch update
    const result = await prisma.submission.updateMany({
      where: {
        id: { in: submissionIds },
      },
      data: {
        status: newStatus,
        reviewerId: session.id,
        reviewerNotes: reviewerNotes ? reviewerNotes.trim() : null,
        reviewedAt: new Date(),
      },
    });

    // Log bulk audit action
    await logAuditAction({
      actorId: session.id,
      action: action === 'APPROVE' ? 'BULK_APPROVE' : 'BULK_REJECT',
      targetType: 'SUBMISSION',
      metadata: {
        count: result.count,
        submissionIds,
        reviewerNotes: reviewerNotes || null,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully ${action === 'APPROVE' ? 'approved' : 'rejected'} ${result.count} submission(s).`,
    });
  } catch (error) {
    console.error('Error executing bulk review:', error);
    return NextResponse.json({ error: 'Failed to process bulk review action' }, { status: 500 });
  }
}
