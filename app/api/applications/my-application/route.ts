import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { db } from '@/lib/db';
import { nssApplications } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apps = await db
      .select()
      .from(nssApplications)
      .where(eq(nssApplications.userId, payload.user_id));

    if (apps.length > 0) {
      // Convert camelCase back to snake_case for frontend compatibility if needed,
      // or just return as is and ensure frontend matches.
      // Since we just swapped to Drizzle, the keys are now camelCase.
      // Wait, the frontend probably expects snake_case for fields like `nss_number`.
      // I should map the Drizzle object to snake_case for backward compatibility,
      // or map it properly.
      const app = apps[0];
      const snakeCaseApp = {
        id: app.id,
        user_id: app.userId,
        nss_number: app.nssNumber,
        first_name: app.firstName,
        last_name: app.lastName,
        middle_name: app.middleName,
        date_of_birth: app.dateOfBirth,
        gender: app.gender,
        nationality: app.nationality,
        phone_number: app.phoneNumber,
        email: app.email,
        residential_address: app.residentialAddress,
        region: app.region,
        district: app.district,
        institution_name: app.institutionName,
        course_program: app.courseProgram,
        year_of_completion: app.yearOfCompletion,
        posting_region: app.postingRegion,
        posting_district: app.postingDistrict,
        posting_station: app.postingStation,
        posting_department: app.postingDepartment,
        service_year: app.serviceYear,
        service_period_start: app.servicePeriodStart,
        service_period_end: app.servicePeriodEnd,
        passport_photo: app.passportPhoto,
        id_card_copy: app.idCardCopy,
        appointment_letter: app.appointmentLetter,
        certificates: app.certificates,
        additional_info: app.additionalInfo,
        status: app.status,
        reviewed_by: app.reviewedBy,
        review_notes: app.reviewNotes,
        reviewed_at: app.reviewedAt,
        created_at: app.createdAt,
        updated_at: app.updatedAt,
      };

      return NextResponse.json({ application: snakeCaseApp });
    } else {
      return NextResponse.json({ application: null });
    }
  } catch (error: any) {
    console.error('My application error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application: ' + error.message },
      { status: 500 }
    );
  }
}
