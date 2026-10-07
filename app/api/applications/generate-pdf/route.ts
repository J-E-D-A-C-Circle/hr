import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { db } from '@/lib/db';
import { nssApplications, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAutoServiceYear } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let applicationIdStr = searchParams.get('id');
    const type = searchParams.get('type') || 'appointment';

    let appIdNum: number | null = applicationIdStr ? parseInt(applicationIdStr, 10) : null;

    if (!appIdNum && payload.role === 'applicant') {
      const requiredStatus = type === 'reposting' ? 'rejected' : 'approved';
      const userApps = await db
        .select()
        .from(nssApplications)
        .where(
          and(
            eq(nssApplications.userId, payload.user_id),
            eq(nssApplications.status, requiredStatus as any)
          )
        );

      if (userApps.length > 0) {
        appIdNum = userApps[0].id;
      } else {
        // Fallback: check if applicant has any application
        const anyUserApps = await db
          .select()
          .from(nssApplications)
          .where(eq(nssApplications.userId, payload.user_id));

        if (anyUserApps.length > 0) {
          appIdNum = anyUserApps[0].id;
        } else {
          return NextResponse.json(
            { error: `No application found for current user` },
            { status: 404 }
          );
        }
      }
    }

    if (!appIdNum) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    const apps = await db
      .select({
        id: nssApplications.id,
        user_id: nssApplications.userId,
        nss_number: nssApplications.nssNumber,
        first_name: nssApplications.firstName,
        last_name: nssApplications.lastName,
        middle_name: nssApplications.middleName,
        date_of_birth: nssApplications.dateOfBirth,
        gender: nssApplications.gender,
        nationality: nssApplications.nationality,
        phone_number: nssApplications.phoneNumber,
        email: nssApplications.email,
        residential_address: nssApplications.residentialAddress,
        region: nssApplications.region,
        district: nssApplications.district,
        institution_name: nssApplications.institutionName,
        course_program: nssApplications.courseProgram,
        year_of_completion: nssApplications.yearOfCompletion,
        posting_region: nssApplications.postingRegion,
        posting_district: nssApplications.postingDistrict,
        posting_station: nssApplications.postingStation,
        posting_department: nssApplications.postingDepartment,
        service_year: nssApplications.serviceYear,
        service_period_start: nssApplications.servicePeriodStart,
        service_period_end: nssApplications.servicePeriodEnd,
        passport_photo: nssApplications.passportPhoto,
        id_card_copy: nssApplications.idCardCopy,
        appointment_letter: nssApplications.appointmentLetter,
        certificates: nssApplications.certificates,
        additional_info: nssApplications.additionalInfo,
        status: nssApplications.status,
        reviewed_by: nssApplications.reviewedBy,
        review_notes: nssApplications.reviewNotes,
        reviewed_at: nssApplications.reviewedAt,
        created_at: nssApplications.createdAt,
        updated_at: nssApplications.updatedAt,
        user_name: users.fullName,
      })
      .from(nssApplications)
      .innerJoin(users, eq(nssApplications.userId, users.id))
      .where(eq(nssApplications.id, appIdNum));

    if (apps.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const app: any = apps[0];

    if (payload.role === 'applicant' && app.user_id !== payload.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (type === 'reposting') {
      if (app.status !== 'rejected') {
        return NextResponse.json(
          { error: 'Reposting letter is only available for rejected applications' },
          { status: 400 }
        );
      }
    } else {
      if (app.status !== 'approved') {
        return NextResponse.json(
          { error: 'Application must be approved to generate appointment letter' },
          { status: 400 }
        );
      }
    }

    // Extract appointment letter data from additional_info if saved
    if (app.additional_info) {
      try {
        const parsed = JSON.parse(app.additional_info);
        if (parsed.appointmentLetterData) {
          app.appointmentLetterData = parsed.appointmentLetterData;
          app.appointmentLetterObject = parsed.appointmentLetterData;
        } else if (parsed.appointmentType || parsed.customRefNumber) {
          app.appointmentLetterData = parsed;
          app.appointmentLetterObject = parsed;
        }
      } catch (e) {
        // Ignored
      }
    }

    if (type === 'reposting') {
      const letterData = app.appointmentLetterObject || app.appointmentLetterData;
      const currentServiceYear = getAutoServiceYear(app.service_year);
      const repostingBody = `We write to inform your esteemed office that the bearer of this letter has been released to the National Service Secretariat for reposting.\n\nBy this letter we write to confirm the release of the National Service Person.\n\nCounting on your usual cooperation.`;
      
      if (letterData && typeof letterData === 'object') {
        const isStale = letterData.appointmentType !== 'REPOSTING' || 
          letterData.customSubject === 'POSTING OF NATIONAL SERVICE PERSONNEL.' ||
          letterData.customSubject === 'REPOSTING OF NATIONAL SERVICE PERSONNEL.' ||
          letterData.customSubject === 'REQUEST FOR REPOSTING' ||
          !letterData.customBodyText ||
          letterData.customBodyText.includes('assigned to') ||
          letterData.customBodyText.includes('reposted to the') ||
          letterData.customBodyText.includes('has requested to be released');

        if (isStale) {
          const sanitized = {
            ...letterData,
            appointmentType: 'REPOSTING',
            customSubject: `RELEASE OF NATIONAL SERVICE PERSONNEL FOR THE ${currentServiceYear} SERVICE YEAR`,
            salutation: 'Dear Madam,',
            customBodyText: repostingBody,
          };
          app.appointmentLetterData = sanitized;
          app.appointmentLetterObject = sanitized;
        }
      } else {
        const defaultReposting = {
          appointmentType: 'REPOSTING',
          customSubject: `RELEASE OF NATIONAL SERVICE PERSONNEL FOR THE ${currentServiceYear} SERVICE YEAR`,
          salutation: 'Dear Madam,',
          customBodyText: repostingBody,
        };
        app.appointmentLetterData = defaultReposting;
        app.appointmentLetterObject = defaultReposting;
      }
    }

    return NextResponse.json({
      application: app,
      pdf_data: app,
    });
  } catch (error: any) {
    console.error('Generate PDF route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment details: ' + error.message },
      { status: 500 }
    );
  }
}

