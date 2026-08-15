import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let sql = `
      SELECT a.*, u.full_name as user_name, u.email as user_email 
      FROM nss_applications a 
      JOIN users u ON a.user_id = u.id 
    `;
    const params: any[] = [];

    if (status) {
      sql += ` WHERE a.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY a.created_at DESC`;

    const applications = await query<any[]>(sql, params);

    return NextResponse.json({ applications });
  } catch (error: any) {
    console.error('Fetch all applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications: ' + error.message },
      { status: 500 }
    );
  }
}
