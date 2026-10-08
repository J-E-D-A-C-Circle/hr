import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { db } from '@/lib/db';
import { nssApplications, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function handleReviewRequest(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const data = await request.json();
    const applicationId = data.application_id || data.id;
    const status = data.status;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // If updating appointment letter data specifically without status change
    if (!status && data.appointmentLetterData) {
      const existing = await db
        .select({ additionalInfo: nssApplications.additionalInfo })
        .from(nssApplications)
        .where(eq(nssApplications.id, parseInt(applicationId, 10)));
      
      let existingExtra: any = {};
      if (existing.length > 0 && existing[0].additionalInfo) {
        try {
          existingExtra = JSON.parse(existing[0].additionalInfo);
        } catch (e) {
          existingExtra = { raw: existing[0].additionalInfo };
        }
      }
      existingExtra.appointmentLetterData = data.appointmentLetterData;

      await db.update(nssApplications)
        .set({
          additionalInfo: JSON.stringify(existingExtra),
          updatedAt: new Date(),
        })
        .where(eq(nssApplications.id, parseInt(applicationId, 10)));

      return NextResponse.json({ message: 'Appointment letter updated successfully' });
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
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
    const servicePeriodStart = '2026-11-02';
    const servicePeriodEnd = '2027-10-29';

    const updateFields: any = {
      status: status as any,
      reviewedBy: payload.user_id,
      reviewNotes,
      postingStation,
      postingDepartment,
      reviewedAt: new Date(),
    };

    if (servicePeriodStart !== null) {
      updateFields.servicePeriodStart = servicePeriodStart;
    }
    if (servicePeriodEnd !== null) {
      updateFields.servicePeriodEnd = servicePeriodEnd;
    }

    if (data.appointmentLetterData) {
      const existing = await db
        .select({ additionalInfo: nssApplications.additionalInfo })
        .from(nssApplications)
        .where(eq(nssApplications.id, parseInt(applicationId, 10)));
      
      let existingExtra: any = {};
      if (existing.length > 0 && existing[0].additionalInfo) {
        try {
          existingExtra = JSON.parse(existing[0].additionalInfo);
        } catch (e) {
          existingExtra = { raw: existing[0].additionalInfo };
        }
      }
      existingExtra.appointmentLetterData = data.appointmentLetterData;
      updateFields.additionalInfo = JSON.stringify(existingExtra);
    }

    await db.update(nssApplications)
      .set(updateFields)
      .where(eq(nssApplications.id, parseInt(applicationId, 10)));

    // Log to audit_logs table
    try {
      await db.insert(auditLogs).values({
        userId: payload.user_id,
        userName: payload.email || 'Admin',
        action: `Application ${status.toUpperCase()}`,
        entityType: 'application',
        entityId: parseInt(applicationId, 10),
        details: `Status changed to ${status}${postingStation ? ` (Station: ${postingStation}, Dept: ${postingDepartment}, Start Date: ${servicePeriodStart || 'N/A'})` : ''}`,
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

export async function PUT(request: Request) {
  return handleReviewRequest(request);
}

export async function POST(request: Request) {
  return handleReviewRequest(request);
}

