import { NextResponse } from 'next/server';
import { getAuthPayload, comparePassword, hashPassword, generateToken } from '@/lib/auth';
import { query, ensureMustChangePasswordColumn } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureMustChangePasswordColumn();

    const body = await request.json();
    const currentPassword = String(body?.currentPassword || '');
    const newPassword = String(body?.newPassword || '').trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: 'New password must be different from your current password.' },
        { status: 400 }
      );
    }

    const rows = await query<any[]>(
      `SELECT id, email, password_hash, role, full_name FROM users WHERE id = ? LIMIT 1`,
      [payload.user_id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = rows[0];
    let normalizedHash = String(user.password_hash || '');
    if (normalizedHash.startsWith('$2y$')) {
      normalizedHash = '$2a$' + normalizedHash.substring(4);
    }

    const isMatch = await comparePassword(currentPassword, normalizedHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect.' },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await query(
      `UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = NOW() WHERE id = ?`,
      [newHash, user.id]
    );

    try {
      await query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.full_name || user.email,
          'ADMIN_PASSWORD_CHANGED',
          'user',
          user.id,
          `User ${user.email} changed their password`,
        ]
      );
    } catch {
      // Do not fail password change if audit logging fails
    }

    const token = generateToken({
      user_id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    });

    return NextResponse.json({
      message: 'Password updated successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        must_change_password: false,
      },
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password: ' + (error.message || 'Server error') },
      { status: 500 }
    );
  }
}
