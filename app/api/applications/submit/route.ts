import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { query } from '@/lib/db';

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
    const existing = await query<any[]>(
      'SELECT id, status, passport_photo, id_card_copy, appointment_letter, certificates FROM nss_applications WHERE user_id = ?',
      [payload.user_id]
    );

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
    const dob = cleanDbDate(data.date_of_birth || data.dateOfBirth);
    const postingRegion = data.posting_region || data.region || null;
    const postingDistrict = data.posting_district || data.district || null;
    const serviceStart = cleanDbDate(data.service_period_start);
    const serviceEnd = cleanDbDate(data.service_period_end);
    
    // Preserve existing documents if new ones are not provided
    const passportPhoto = data.passport_photo || (existing.length > 0 ? existing[0].passport_photo : null);
    const idCard = data.id_card_copy || (existing.length > 0 ? existing[0].id_card_copy : null);
    const appointmentLetter = data.appointment_letter || (existing.length > 0 ? existing[0].appointment_letter : null);
    const certificates = data.certificates || (existing.length > 0 ? existing[0].certificates : null);
    const additionalInfo = data.additional_info || null;
    const yearOfCompletion = parseInt(data.year_of_completion, 10);
    const serviceYear = parseInt(data.service_year, 10);

    let applicationId = 0;

    if (existing.length > 0) {
      applicationId = existing[0].id;
      const targetStatus = existing[0].status === 'draft' ? 'pending' : existing[0].status;
      const updateSql = `
        UPDATE nss_applications SET
          nss_number = ?, first_name = ?, last_name = ?, middle_name = ?, date_of_birth = ?, gender = ?,
          nationality = ?, phone_number = ?, email = ?, residential_address = ?, region = ?, district = ?,
          institution_name = ?, course_program = ?, year_of_completion = ?, posting_region = ?,
          posting_district = ?, service_year = ?, service_period_start = ?, service_period_end = ?,
          passport_photo = ?, id_card_copy = ?, appointment_letter = ?, certificates = ?, additional_info = ?,
          status = ?
        WHERE id = ?
      `;

      await query(updateSql, [
        nssNumber,
        data.first_name,
        data.last_name,
        middleName,
        dob,
        data.gender,
        data.nationality,
        data.phone_number,
        data.email,
        data.residential_address,
        data.region,
        data.district,
        data.institution_name,
        data.course_program,
        yearOfCompletion,
        postingRegion,
        postingDistrict,
        serviceYear,
        serviceStart,
        serviceEnd,
        passportPhoto,
        idCard,
        appointmentLetter,
        certificates,
        additionalInfo,
        targetStatus,
        applicationId,
      ]);
    } else {
      const insertSql = `
        INSERT INTO nss_applications (
          user_id, nss_number, first_name, last_name, middle_name, date_of_birth, gender,
          nationality, phone_number, email, residential_address, region, district,
          institution_name, course_program, year_of_completion, posting_region,
          posting_district, service_year, service_period_start, service_period_end,
          passport_photo, id_card_copy, appointment_letter, certificates, additional_info, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `;

      const result = await query<any>(insertSql, [
        payload.user_id,
        nssNumber,
        data.first_name,
        data.last_name,
        middleName,
        dob,
        data.gender,
        data.nationality,
        data.phone_number,
        data.email,
        data.residential_address,
        data.region,
        data.district,
        data.institution_name,
        data.course_program,
        yearOfCompletion,
        postingRegion,
        postingDistrict,
        serviceYear,
        serviceStart,
        serviceEnd,
        passportPhoto,
        idCard,
        appointmentLetter,
        certificates,
        additionalInfo,
      ]);
      applicationId = result.insertId;
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
