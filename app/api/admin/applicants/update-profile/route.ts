import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      userId,
      applicationId,
      email,
      phoneNumber,
      residentialAddress,
      firstName,
      middleName,
      lastName,
      nssNumber,
      region,
      district,
    } = body;

    const targetUserId = Number(userId);
    if (!targetUserId || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'Valid userId is required.' },
        { status: 400 }
      );
    }

    // Verify user exists
    const usersList: any[] = await query(
      `SELECT id, email, full_name FROM users WHERE id = ? AND role = 'applicant'`,
      [targetUserId]
    );

    if (usersList.length === 0) {
      return NextResponse.json(
        { error: 'Applicant account not found.' },
        { status: 404 }
      );
    }

    const existingUser = usersList[0];
    const changedFields: string[] = [];

    // 1. Process Email change
    let cleanEmail = existingUser.email;
    if (email !== undefined) {
      cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }

      if (cleanEmail !== existingUser.email.toLowerCase()) {
        // Check uniqueness
        const duplicateUsers: any[] = await query(
          `SELECT id FROM users WHERE LOWER(email) = ? AND id != ?`,
          [cleanEmail, targetUserId]
        );
        if (duplicateUsers.length > 0) {
          return NextResponse.json(
            { error: `The email "${cleanEmail}" is already taken by another account.` },
            { status: 400 }
          );
        }
        changedFields.push(`email: ${existingUser.email} -> ${cleanEmail}`);
      }
    }

    // 2. Process Full Name
    let newFullName = existingUser.full_name;
    const nameParts = [firstName, middleName, lastName].filter((n) => typeof n === 'string' && n.trim().length > 0);
    if (nameParts.length > 0) {
      newFullName = nameParts.map((n) => n.trim()).join(' ');
      if (newFullName !== existingUser.full_name) {
        changedFields.push(`name: ${existingUser.full_name} -> ${newFullName}`);
      }
    }

    // Update users table
    await query(
      `UPDATE users SET email = ?, full_name = ?, updated_at = NOW() WHERE id = ?`,
      [cleanEmail, newFullName, targetUserId]
    );

    // 3. Update or create nss_applications record
    const existingApps: any[] = await query(
      `SELECT * FROM nss_applications WHERE user_id = ? OR id = ?`,
      [targetUserId, applicationId ? Number(applicationId) : -1]
    );

    const cleanPhone = phoneNumber !== undefined ? String(phoneNumber).trim() : null;
    const cleanAddress = residentialAddress !== undefined ? String(residentialAddress).trim() : null;
    const cleanFirst = firstName !== undefined ? String(firstName).trim() : null;
    const cleanMiddle = middleName !== undefined ? String(middleName).trim() : null;
    const cleanLast = lastName !== undefined ? String(lastName).trim() : null;
    const cleanNss = nssNumber !== undefined ? String(nssNumber).trim().toUpperCase() : null;
    const cleanRegion = region !== undefined ? String(region).trim() : null;
    const cleanDistrict = district !== undefined ? String(district).trim() : null;

    if (existingApps.length > 0) {
      const app = existingApps[0];

      if (cleanPhone !== null && cleanPhone !== app.phone_number) changedFields.push(`phone: ${cleanPhone}`);
      if (cleanAddress !== null && cleanAddress !== app.residential_address) changedFields.push(`address: ${cleanAddress}`);
      if (cleanNss !== null && cleanNss !== app.nss_number) changedFields.push(`nss: ${cleanNss}`);
      if (cleanRegion !== null && cleanRegion !== app.region) changedFields.push(`region: ${cleanRegion}`);
      if (cleanDistrict !== null && cleanDistrict !== app.district) changedFields.push(`district: ${cleanDistrict}`);

      await query(
        `UPDATE nss_applications SET
          email = ?,
          phone_number = COALESCE(?, phone_number),
          residential_address = COALESCE(?, residential_address),
          first_name = COALESCE(?, first_name),
          middle_name = COALESCE(?, middle_name),
          last_name = COALESCE(?, last_name),
          nss_number = COALESCE(?, nss_number),
          region = COALESCE(?, region),
          district = COALESCE(?, district),
          updated_at = NOW()
        WHERE id = ?`,
        [
          cleanEmail,
          cleanPhone,
          cleanAddress,
          cleanFirst,
          cleanMiddle,
          cleanLast,
          cleanNss,
          cleanRegion,
          cleanDistrict,
          app.id,
        ]
      );
    } else if (cleanPhone || cleanAddress || cleanNss) {
      // Create initial application row for this applicant
      await query(
        `INSERT INTO nss_applications (
          user_id,
          nss_number,
          first_name,
          middle_name,
          last_name,
          date_of_birth,
          gender,
          nationality,
          phone_number,
          email,
          residential_address,
          region,
          district,
          institution_name,
          course_program,
          year_of_completion,
          service_year,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetUserId,
          cleanNss || `NSS-${Date.now().toString().slice(-6)}`,
          cleanFirst || (nameParts[0] || 'Applicant'),
          cleanMiddle || '',
          cleanLast || (nameParts[1] || 'User'),
          '2000-01-01',
          'Male',
          'Ghanaian',
          cleanPhone || '0000000000',
          cleanEmail,
          cleanAddress || 'Pending Address',
          cleanRegion || 'Greater Accra',
          cleanDistrict || 'Accra Metro',
          'National Service Scheme',
          'Personnel Intake',
          2026,
          2026,
          'pending',
        ]
      );
      changedFields.push('created initial application record');
    }

    // Insert audit log
    try {
      await query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          payload.user_id,
          payload.email || 'Admin',
          'UPDATE_APPLICANT_PROFILE',
          'applicant',
          targetUserId,
          `Admin updated profile for applicant ${cleanEmail}: ${changedFields.join(', ') || 'No significant changes'}`,
        ]
      );
    } catch (e) {
      console.warn('Audit log insert warning:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Applicant profile updated successfully!`,
      updatedEmail: cleanEmail,
      updatedFullName: newFullName,
    });
  } catch (error: any) {
    console.error('[Admin Update Profile] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update applicant profile: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
