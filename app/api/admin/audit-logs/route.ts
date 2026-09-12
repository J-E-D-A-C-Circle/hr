import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Try fetching audit logs; if table doesn't exist yet, return gracefully
    try {
      const logs = await query(`
        SELECT a.*, u.full_name as user_full_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 100
      `);

      return NextResponse.json({ logs });
    } catch (dbErr: any) {
      // If table doesn't exist yet in local MySQL, fallback gracefully
      return NextResponse.json({ logs: [], warning: 'Audit log table not initialized yet' });
    }
  } catch (error: any) {
    console.error('Audit log fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { action, entity_type, entity_id, details } = await request.json();

    try {
      await query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          payload.user_id,
          payload.email || 'Admin',
          action,
          entity_type || 'application',
          entity_id || null,
          details || '',
        ]
      );
    } catch (e) {
      // Ignore if table not present
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
