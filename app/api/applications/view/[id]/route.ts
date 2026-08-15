import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { query } from '@/lib/db';

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

    const sql = `
      SELECT a.*, u.full_name as user_name, u.email as user_email,
             r.full_name as reviewer_name
      FROM nss_applications a 
      JOIN users u ON a.user_id = u.id 
      LEFT JOIN users r ON a.reviewed_by = r.id
      WHERE a.id = ?
    `;

    const apps = await query<any[]>(sql, [applicationId]);

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
