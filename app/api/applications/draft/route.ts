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

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apps = await query<any[]>(
      'SELECT * FROM nss_applications WHERE user_id = ?',
      [payload.user_id]
    );

    if (apps.length > 0) {
      return NextResponse.json({ application: apps[0] });
    }

    return NextResponse.json({ application: null });
  } catch (error: any) {
    console.error('Fetch draft error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Find existing draft application
    const existing = await query<any[]>(
      "SELECT id FROM nss_applications WHERE user_id = ?",
      [payload.user_id]
    );

    const nssNumber = data.nss_number || data.nssPin || null;
    const firstName = data.first_name || data.firstName || '';
    const lastName = data.last_name || data.lastName || '';
    const middleName = data.middle_name || data.middleName || null;
    const dob = cleanDbDate(data.date_of_birth || data.dateOfBirth);
    const gender = data.gender || 'Male';
    const nationality = data.nationality || 'Ghanaian';
    const phoneNumber = data.phone_number || data.phoneNumber || '';
    const email = data.email || payload.email || '';
    const address = data.residential_address || data.address || '';
    const region = data.region || '';
    const district = data.district || '';
    const institution = data.institution_name || data.school || '';
    const course = data.course_program || data.course || '';
    const completionYear = data.year_of_completion || data.yearOfCompletion ? parseInt(String(data.year_of_completion || data.yearOfCompletion), 10) : new Date().getFullYear();
    const serviceYearVal = data.service_year || data.serviceYear ? parseInt(String(data.service_year || data.serviceYear), 10) : new Date().getFullYear();
    const passportPhoto = data.passport_photo || null;
    const idCardCopy = data.id_card_copy || null;
    const appointmentLetter = data.appointment_letter || null;
    const certificates = data.certificates || data.cv || null;
    const additionalInfo = data.additional_info || data.currentStep ? JSON.stringify({ currentStep: data.currentStep || data.step || 1 }) : null;

    if (existing.length > 0) {
      // Update existing draft
      const updateSql = `
        UPDATE nss_applications SET
          nss_number = ?,
          first_name = ?,
          last_name = ?,
          middle_name = ?,
          date_of_birth = ?,
          gender = ?,
          nationality = ?,
          phone_number = ?,
          email = ?,
          residential_address = ?,
          region = ?,
          district = ?,
          institution_name = ?,
          course_program = ?,
          year_of_completion = ?,
          posting_region = ?,
          posting_district = ?,
          service_year = ?,
          passport_photo = ?,
          id_card_copy = ?,
          appointment_letter = ?,
          certificates = ?,
          additional_info = ?
        WHERE id = ?
      `;

      await query(updateSql, [
        nssNumber,
        firstName,
        lastName,
        middleName,
        dob,
        gender,
        nationality,
        phoneNumber,
        email,
        address,
        region,
        district,
        institution,
        course,
        completionYear,
        region,
        district,
        serviceYearVal,
        passportPhoto,
        idCardCopy,
        appointmentLetter,
        certificates,
        additionalInfo,
        existing[0].id,
      ]);

      return NextResponse.json({
        message: 'Draft auto-saved successfully',
        application_id: existing[0].id,
        status: 'draft',
      });
    } else {
      // Insert new draft application
      const insertSql = `
        INSERT INTO nss_applications (
          user_id, nss_number, first_name, last_name, middle_name, date_of_birth, gender,
          nationality, phone_number, email, residential_address, region, district,
          institution_name, course_program, year_of_completion, posting_region,
          posting_district, service_year, passport_photo, id_card_copy, appointment_letter,
          certificates, additional_info, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
      `;

      const result = await query<any>(insertSql, [
        payload.user_id,
        nssNumber,
        firstName,
        lastName,
        middleName,
        dob || '2000-01-01',
        gender,
        nationality,
        phoneNumber,
        email,
        address,
        region,
        district,
        institution,
        course,
        completionYear,
        region,
        district,
        serviceYearVal,
        passportPhoto,
        idCardCopy,
        appointmentLetter,
        certificates,
        additionalInfo,
      ]);

      return NextResponse.json(
        {
          message: 'Draft created successfully',
          application_id: result.insertId,
          status: 'draft',
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error('Draft auto-save error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-save draft: ' + error.message },
      { status: 500 }
    );
  }
}
