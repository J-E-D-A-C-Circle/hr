import { NextResponse } from 'next/server';
import { getAuthPayload, hashPassword } from '@/lib/auth';
import { query, ensureMustChangePasswordColumn } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await ensureMustChangePasswordColumn();

    const admins = await query<any[]>(
      `SELECT id, email, full_name, must_change_password, created_at, updated_at
       FROM users
       WHERE role = 'admin'
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ admins });
  } catch (error: any) {
    console.error('[Admin Accounts] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin accounts: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await ensureMustChangePasswordColumn();

    const body = await request.json();
    const fullName = String(body?.fullName || '').trim();
    const cleanEmail = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!fullName || !cleanEmail || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and temporary password are required.' },
        { status: 400 }
      );
    }

    if (!cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Temporary password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const existing = await query<any[]>(
      `SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1`,
      [cleanEmail]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `An account with email "${cleanEmail}" already exists.` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const result = await query<any>(
      `INSERT INTO users (email, password_hash, role, full_name, must_change_password) VALUES (?, ?, 'admin', ?, 1)`,
      [cleanEmail, passwordHash, fullName]
    );

    try {
      await query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          payload.user_id,
          payload.full_name || payload.email,
          'CREATE_ADMIN_ACCOUNT',
          'user',
          result.insertId,
          `Created admin account for ${fullName} (${cleanEmail}) with mandatory first-login password change`,
        ]
      );
    } catch {
      // Non-fatal
    }

    return NextResponse.json(
      {
        message: 'Admin account created successfully. They will be required to change their password on first login.',
        admin: {
          id: result.insertId,
          email: cleanEmail,
          full_name: fullName,
          must_change_password: 1,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin Accounts] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await ensureMustChangePasswordColumn();

    const body = await request.json();
    const adminId = Number(body?.userId);
    const newPassword = String(body?.newPassword || '').trim();

    if (!adminId || isNaN(adminId)) {
      return NextResponse.json({ error: 'Valid userId is required.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const hash = await hashPassword(newPassword);
    await query(
      `UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = NOW() WHERE id = ? AND role = 'admin'`,
      [hash, adminId]
    );

    try {
      await query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          payload.user_id,
          payload.full_name || payload.email,
          'RESET_ADMIN_PASSWORD',
          'user',
          adminId,
          `Reset password for admin ID ${adminId} with mandatory password change`,
        ]
      );
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      message: 'Admin password reset. They will be prompted to change it on next login.',
    });
  } catch (error: any) {
    console.error('[Admin Accounts] Reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset admin password: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Valid admin id is required.' }, { status: 400 });
    }

    if (id === payload.user_id) {
      return NextResponse.json({ error: 'You cannot delete your own active admin account.' }, { status: 400 });
    }

    const countRows = await query<any[]>(`SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'`);
    if ((countRows[0]?.cnt || 0) <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last remaining admin account.' }, { status: 400 });
    }

    await query(`DELETE FROM users WHERE id = ? AND role = 'admin'`, [id]);

    return NextResponse.json({ message: 'Admin account deleted successfully.' });
  } catch (error: any) {
    console.error('[Admin Accounts] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin account: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
