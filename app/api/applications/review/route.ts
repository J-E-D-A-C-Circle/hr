import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { db } from '@/lib/db';
import { nssApplications, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const data = await request.json();
    const applicationId = data.application_id || data.id;
    const status = data.status;

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Application ID and status are required' },
        { status: 400 }
      );
    }

    const allowedStatuses = ['approved', 'rejected', 'under_review', 'pending'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'approved') {
      if (!data.posting_station || !data.posting_department) {
        return NextResponse.json(
          { error: 'Posting station and department are required for approval' },
          { status: 400 }
        );
      }
    }

    const reviewNotes = data.review_notes || null;
    const postingStation = data.posting_station || null;
    const postingDepartment = data.posting_department || null;

    await db.update(nssApplications)
      .set({
        status: status as any,
        reviewedBy: payload.user_id,
        reviewNotes,
        postingStation,
        postingDepartment,
        reviewedAt: new Date(),
      })
      .where(eq(nssApplications.id, parseInt(applicationId, 10)));

    // Log to audit_logs table
    try {
      await db.insert(auditLogs).values({
        userId: payload.user_id,
        userName: payload.email || 'Admin',
        action: `Application ${status.toUpperCase()}`,
        entityType: 'application',
        entityId: parseInt(applicationId, 10),
        details: `Status changed to ${status}${postingStation ? ` (Station: ${postingStation}, Dept: ${postingDepartment})` : ''}`,
      });
    } catch (auditErr) {
      // Ignore if audit fails
    }

    return NextResponse.json({
      message: 'Application reviewed successfully',
      status,
    });
  } catch (error: any) {
    console.error('Review application error:', error);
    return NextResponse.json(
      { error: 'Failed to update application: ' + error.message },
      { status: 500 }
    );
  }
}
