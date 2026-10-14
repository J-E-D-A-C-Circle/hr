import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { db } from '@/lib/db';
import { nssApplications, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendWigalSms } from '@/lib/wigal';

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

    const appIdNum = parseInt(String(applicationId), 10);
    if (isNaN(appIdNum)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    // Fetch existing application details
    const existingList = await db
      .select({
        id: nssApplications.id,
        status: nssApplications.status,
        firstName: nssApplications.firstName,
        middleName: nssApplications.middleName,
        lastName: nssApplications.lastName,
        phoneNumber: nssApplications.phoneNumber,
        email: nssApplications.email,
        additionalInfo: nssApplications.additionalInfo,
      })
      .from(nssApplications)
      .where(eq(nssApplications.id, appIdNum));

    if (existingList.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const existingApp = existingList[0];
    const previousStatus = existingApp.status;

    let existingExtra: any = {};
    if (existingApp.additionalInfo) {
      try {
        existingExtra = JSON.parse(existingApp.additionalInfo);
      } catch (e) {
        existingExtra = { raw: existingApp.additionalInfo };
      }
    }

    // If updating appointment letter data specifically without status change
    if (!status && data.appointmentLetterData) {
      existingExtra.appointmentLetterData = data.appointmentLetterData;

      await db.update(nssApplications)
        .set({
          additionalInfo: JSON.stringify(existingExtra),
          updatedAt: new Date(),
        })
        .where(eq(nssApplications.id, appIdNum));

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

    if (data.appointmentLetterData) {
      existingExtra.appointmentLetterData = data.appointmentLetterData;
    }

    // Send SMS notification if application is approved or rejected
    let smsResult: any = null;
    const shouldSendSms =
      (status === 'approved' || status === 'rejected') &&
      (previousStatus !== status || data.send_sms === true);

    if (shouldSendSms && existingApp.phoneNumber) {
      const fullName = [existingApp.firstName, existingApp.middleName, existingApp.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Applicant';

      const portalUrl = 'https://nss.dvla.gov.gh';

      const message =
        status === 'approved'
          ? `Dear ${fullName}, congratulations! Your DVLA NSS application has been successfully approved. Visit ${portalUrl} to log in and download your appointment letter. NB: Use Chrome to download your appointment letter.`
          : `Dear ${fullName}, we regret to inform you that your DVLA NSS application was not successful for this intake. Visit ${portalUrl} to log in and download your release letter for reposting. NB: Use Chrome to download your release letter.`;

      try {
        smsResult = await sendWigalSms({
          destination: existingApp.phoneNumber,
          message,
          senderId: 'DVLA NSS',
        });
        console.log(`📱 [Review SMS] Status: ${status} | Sent to: ${existingApp.phoneNumber} | Success: ${smsResult.success}`);

        if (!existingExtra.smsHistory) {
          existingExtra.smsHistory = [];
        }
        existingExtra.smsHistory.push({
          type: status,
          sentAt: new Date().toISOString(),
          phone: existingApp.phoneNumber,
          success: smsResult.success,
          message,
        });
      } catch (smsErr: any) {
        console.error('⚠️ [Review SMS Error]:', smsErr);
      }
    }

    const updateFields: any = {
      status: status as any,
      reviewedBy: payload.user_id,
      reviewNotes,
      postingStation,
      postingDepartment,
      additionalInfo: JSON.stringify(existingExtra),
      reviewedAt: new Date(),
    };

    if (servicePeriodStart !== null) {
      updateFields.servicePeriodStart = servicePeriodStart;
    }
    if (servicePeriodEnd !== null) {
      updateFields.servicePeriodEnd = servicePeriodEnd;
    }

    await db.update(nssApplications)
      .set(updateFields)
      .where(eq(nssApplications.id, appIdNum));

    // Log to audit_logs table
    try {
      await db.insert(auditLogs).values({
        userId: payload.user_id,
        userName: payload.email || 'Admin',
        action: `Application ${status.toUpperCase()}`,
        entityType: 'application',
        entityId: appIdNum,
        details: `Status changed from ${previousStatus || 'pending'} to ${status}${
          postingStation ? ` (Station: ${postingStation}, Dept: ${postingDepartment}, Start Date: ${servicePeriodStart || 'N/A'})` : ''
        }${smsResult ? ` | SMS: ${smsResult.success ? 'Delivered' : 'Failed'}` : ''}`,
      });
    } catch (auditErr) {
      // Ignore if audit fails
    }

    return NextResponse.json({
      message: 'Application reviewed successfully',
      status,
      smsSent: smsResult?.success ?? false,
      smsResult: smsResult ? { success: smsResult.success, formattedNumber: smsResult.formattedNumber } : undefined,
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
