import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, nssApplications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    const reviewers = alias(users, 'reviewers');

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
        user_email: users.email,
        reviewer_name: reviewers.fullName,
      })
      .from(nssApplications)
      .innerJoin(users, eq(nssApplications.userId, users.id))
      .leftJoin(reviewers, eq(nssApplications.reviewedBy, reviewers.id))
      .where(eq(nssApplications.id, parseInt(applicationId, 10)));

    if (apps.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ application: apps[0] });
  } catch (error: any) {
    console.error('View application error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application: ' + error.message },
      { status: 500 }
    );
  }
}
