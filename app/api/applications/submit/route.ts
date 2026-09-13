import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { db } from '@/lib/db';
import { nssApplications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendApplicationReceipt } from '@/lib/email';

function cleanDbDate(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str === 'null' || str === 'undefined') return null;
  const cleaned = str.split('T')[0].split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'applicant') {
      return NextResponse.json({ error: 'Unauthorized. Applicants only.' }, { status: 401 });
    }

    const data = await request.json();

    // Check if user already has an application
    const existing = await db
      .select({
        id: nssApplications.id,
        status: nssApplications.status,
        passportPhoto: nssApplications.passportPhoto,
        idCardCopy: nssApplications.idCardCopy,
        appointmentLetter: nssApplications.appointmentLetter,
        certificates: nssApplications.certificates,
      })
      .from(nssApplications)
      .where(eq(nssApplications.userId, payload.user_id));

    // Required fields check
    const required = [
      'first_name', 'last_name', 'date_of_birth', 'gender', 'nationality',
      'phone_number', 'email', 'residential_address', 'region', 'district',
      'institution_name', 'course_program', 'year_of_completion', 'service_year'
    ];

    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        return NextResponse.json(
          { error: `Field '${field}' is required and cannot be empty` },
          { status: 400 }
        );
      }
    }

    const nssNumber = data.nss_number || data.nssPin || null;
    const middleName = data.middle_name || null;
    const dob = cleanDbDate(data.date_of_birth || data.dateOfBirth) as string;
    const postingRegion = data.posting_region || data.region || null;
    const postingDistrict = data.posting_district || data.district || null;
    const serviceStart = cleanDbDate(data.service_period_start);
    const serviceEnd = cleanDbDate(data.service_period_end);
    
    // Preserve existing documents if new ones are not provided
    const passportPhoto = data.passport_photo || (existing.length > 0 ? existing[0].passportPhoto : null);
    const idCard = data.id_card_copy || (existing.length > 0 ? existing[0].idCardCopy : null);
    const appointmentLetter = data.appointment_letter || (existing.length > 0 ? existing[0].appointmentLetter : null);
    const certificates = data.certificates || (existing.length > 0 ? existing[0].certificates : null);
    const additionalInfo = data.additional_info || null;
    const yearOfCompletion = parseInt(data.year_of_completion, 10);
    const serviceYear = parseInt(data.service_year, 10);

    let applicationId = 0;

    const values = {
      nssNumber,
      firstName: data.first_name,
      lastName: data.last_name,
      middleName,
      dateOfBirth: dob,
      gender: data.gender,
      nationality: data.nationality,
      phoneNumber: data.phone_number,
      email: data.email,
      residentialAddress: data.residential_address,
      region: data.region,
      district: data.district,
      institutionName: data.institution_name,
      courseProgram: data.course_program,
      yearOfCompletion,
      postingRegion,
      postingDistrict,
      serviceYear,
      servicePeriodStart: serviceStart,
      servicePeriodEnd: serviceEnd,
      passportPhoto,
      idCardCopy: idCard,
      appointmentLetter,
      certificates,
      additionalInfo,
    };

    if (existing.length > 0) {
      applicationId = existing[0].id;
      // Drizzle doesn't have 'draft' in enum. It was manually 'draft' before but now it's 'pending'.
      // If enum values change in TS, we just fallback to pending.
      const targetStatus = 'pending';
      
      await db.update(nssApplications)
        .set({
          ...values,
          status: targetStatus,
        })
        .where(eq(nssApplications.id, applicationId));
    } else {
      const [result] = await db.insert(nssApplications).values({
        userId: payload.user_id,
        ...values,
        status: 'pending',
      });
      applicationId = result.insertId;
    }

    try {
      await sendApplicationReceipt({
        to: data.email,
        applicantName: `${data.first_name} ${data.last_name}`,
        nssNumber: String(nssNumber),
        applicationId,
      });
    } catch (emailErr) {
      console.error('Failed to send email receipt:', emailErr);
      // We do not fail the submission if email fails
    }

    return NextResponse.json(
      {
        message: 'Application submitted successfully',
        application_id: applicationId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Submit application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application: ' + (error.message || 'Database error') },
      { status: 500 }
    );
  }
}
