import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';

    let sqlQuery = `
      SELECT 
        u.id AS user_id,
        u.email AS user_email,
        u.full_name AS user_full_name,
        u.role AS user_role,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        a.id AS application_id,
        a.nss_number,
        a.first_name,
        a.middle_name,
        a.last_name,
        a.phone_number,
        a.email AS application_email,
        a.residential_address,
        a.region,
        a.district,
        a.status,
        a.posting_station,
        a.posting_department,
        a.institution_name,
        a.course_program,
        a.created_at AS application_created_at,
        a.updated_at AS application_updated_at
      FROM users u
      LEFT JOIN nss_applications a ON u.id = a.user_id
      WHERE u.role = 'applicant'
    `;

    const params: any[] = [];

    if (search) {
      sqlQuery += ` AND (
        u.email LIKE ? OR 
        u.full_name LIKE ? OR 
        a.nss_number LIKE ? OR 
        a.phone_number LIKE ? OR 
        a.first_name LIKE ? OR 
        a.last_name LIKE ? OR 
        a.residential_address LIKE ?
      )`;
      const wild = `%${search}%`;
      params.push(wild, wild, wild, wild, wild, wild, wild);
    }

    sqlQuery += ` ORDER BY COALESCE(a.updated_at, u.updated_at, u.created_at) DESC`;

    const applicants = await query(sqlQuery, params);

    return NextResponse.json({ applicants });
  } catch (error: any) {
    console.error('[Admin Applicants] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applicants: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
