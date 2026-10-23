import { NextResponse } from 'next/server';
import { getAuthPayload, hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, userIds, newPassword } = body;

    const cleanPassword = String(newPassword || '').trim();
    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(cleanPassword);

    // 1. Bulk Reset All Applicants
    if (userIds === 'all') {
      const updateResult: any = await query(
        `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE role = 'applicant'`,
        [newHash]
      );

      const affected = updateResult?.affectedRows || 0;

      // Insert audit log
      try {
        await query(
          `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            payload.user_id,
            payload.email || 'Admin',
            'BULK_PASSWORD_RESET',
            'user',
            null,
            `Admin reset passwords for all applicant accounts (${affected} accounts updated)`,
          ]
        );
      } catch (e) {
        console.warn('Audit log insert warning:', e);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully reset password for all ${affected} applicant accounts.`,
        count: affected,
        newPassword: cleanPassword,
      });
    }

    // 2. Bulk Reset Specific List of Applicants
    if (Array.isArray(userIds) && userIds.length > 0) {
      const validIds = userIds.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0);
      if (validIds.length === 0) {
        return NextResponse.json({ error: 'No valid user IDs provided.' }, { status: 400 });
      }

      const placeholders = validIds.map(() => '?').join(',');
      const updateResult: any = await query(
        `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id IN (${placeholders}) AND role = 'applicant'`,
        [newHash, ...validIds]
      );

      const affected = updateResult?.affectedRows || 0;

      try {
        await query(
          `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            payload.user_id,
            payload.email || 'Admin',
            'BULK_PASSWORD_RESET',
            'user',
            null,
            `Admin reset passwords for ${affected} selected applicant accounts (User IDs: ${validIds.join(', ')})`,
          ]
        );
      } catch (e) {
        console.warn('Audit log insert warning:', e);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully reset password for ${affected} applicant accounts.`,
        count: affected,
        newPassword: cleanPassword,
      });
    }

    // 3. Single Applicant Reset
    const targetUserId = Number(userId);
    if (!targetUserId || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'Valid userId or userIds list is required.' },
        { status: 400 }
      );
    }

    const existingUsers: any[] = await query(
      `SELECT id, email, full_name FROM users WHERE id = ? AND role = 'applicant'`,
      [targetUserId]
    );

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'Applicant account not found.' },
        { status: 404 }
      );
    }

    const targetUser = existingUsers[0];

    await query(
      `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ? AND role = 'applicant'`,
      [newHash, targetUserId]
    );

    try {
      await query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          payload.user_id,
          payload.email || 'Admin',
          'PASSWORD_RESET',
          'user',
          targetUserId,
          `Admin reset password for applicant ${targetUser.email} (${targetUser.full_name})`,
        ]
      );
    } catch (e) {
      console.warn('Audit log insert warning:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${targetUser.email}.`,
      count: 1,
      targetEmail: targetUser.email,
      newPassword: cleanPassword,
    });
  } catch (error: any) {
    console.error('[Admin Reset Password] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
