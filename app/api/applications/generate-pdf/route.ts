import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let applicationId = searchParams.get('id');
    const type = searchParams.get('type') || 'appointment';

    if (!applicationId && payload.role === 'applicant') {
      const requiredStatus = type === 'reposting' ? 'rejected' : 'approved';
      const userApps = await query<any[]>(
        "SELECT id FROM nss_applications WHERE user_id = ? AND status = ?",
        [payload.user_id, requiredStatus]
      );
      if (userApps.length > 0) {
        applicationId = userApps[0].id;
      } else {
        return NextResponse.json(
          { error: `No ${requiredStatus} application found for current user` },
          { status: 404 }
        );
      }
    }

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    const apps = await query<any[]>(
      `SELECT a.*, u.full_name as user_name 
       FROM nss_applications a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [applicationId]
    );

    if (apps.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const app = apps[0];

    if (payload.role === 'applicant' && app.user_id !== payload.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (type === 'reposting') {
      if (app.status !== 'rejected') {
        return NextResponse.json(
          { error: 'Reposting letter is only available for rejected applications' },
          { status: 400 }
        );
      }
    } else {
      if (app.status !== 'approved') {
        return NextResponse.json(
          { error: 'Application must be approved to generate appointment letter' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      application: app,
      pdf_data: app,
    });
  } catch (error: any) {
    console.error('Generate PDF route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment details: ' + error.message },
      { status: 500 }
    );
  }
}
