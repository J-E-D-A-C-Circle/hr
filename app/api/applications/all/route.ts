import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, nssApplications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = db
      .select({
        // Application fields mapping to snake_case for frontend
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
        // Joined user fields
        user_name: users.fullName,
        user_email: users.email,
      })
      .from(nssApplications)
      .innerJoin(users, eq(nssApplications.userId, users.id))
      .$dynamic();

    if (status) {
      // Cast the status string to the enum type to satisfy TS, or let drizzle handle it
      query = query.where(eq(nssApplications.status, status as any));
    }

    const applications = await query.orderBy(desc(nssApplications.createdAt));

    return NextResponse.json({ applications });
  } catch (error: any) {
    console.error('Fetch all applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications: ' + error.message },
      { status: 500 }
    );
  }
}
