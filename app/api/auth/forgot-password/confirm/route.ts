import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, nssApplications, verificationTokens } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, identifier, token, newPassword } = body;

    const cleanIdentifier = String(identifier || '').trim();
    const cleanToken = String(token || '').trim();

    if (!method || !cleanIdentifier || !cleanToken || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required (method, identifier, verification code, new password).' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = rateLimit(`verify-forgot:${cleanIdentifier}:${ip}`, 5, 10 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Retrieve latest token record for identifier
    const records = await db
      .select({
        id: verificationTokens.id,
        token: verificationTokens.token,
        expiresAt: verificationTokens.expiresAt,
        isUsed: verificationTokens.isUsed,
      })
      .from(verificationTokens)
      .where(eq(verificationTokens.phoneNumber, cleanIdentifier))
      .orderBy(desc(verificationTokens.createdAt))
      .limit(1);

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No active verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    const record = records[0];

    if (record.isUsed) {
      return NextResponse.json(
        { error: 'This verification code has already been used. Please request a new code.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(record.expiresAt)) {
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    if (record.token !== cleanToken) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Locate user record to update
    let targetUserId: number | null = null;

    if (method === 'email') {
      const lowerEmail = cleanIdentifier.toLowerCase();
      const userList = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`LOWER(${users.email}) = ${lowerEmail}`);

      if (userList.length > 0) {
        targetUserId = userList[0].id;
      } else {
        // Find user linked via application email
        const appList = await db
          .select({ userId: nssApplications.userId })
          .from(nssApplications)
          .where(sql`LOWER(${nssApplications.email}) = ${lowerEmail}`);
        if (appList.length > 0) {
          targetUserId = appList[0].userId;
        }
      }
    } else {
      // Find user linked via phone number in applications
      const cleanDigits = cleanIdentifier.replace(/\D/g, '');
      const appList = await db
        .select({ userId: nssApplications.userId })
        .from(nssApplications)
        .where(sql`REPLACE(REPLACE(REPLACE(${nssApplications.phoneNumber}, ' ', ''), '-', ''), '+', '') LIKE ${'%' + cleanDigits}`);

      if (appList.length > 0) {
        targetUserId = appList[0].userId;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Could not locate an account associated with this information.' },
        { status: 404 }
      );
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, targetUserId));

    // Mark verification token as used
    await db
      .update(verificationTokens)
      .set({ isUsed: true })
      .where(eq(verificationTokens.id, record.id));

    return NextResponse.json({
      message: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('[Forgot Password] Confirm error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
