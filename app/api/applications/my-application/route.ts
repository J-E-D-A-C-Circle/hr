import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { query } from '@/lib/db';

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
