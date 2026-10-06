import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, nssApplications, verificationTokens } from '@/db/schema';
import { eq, desc, or, sql } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { verifyFrogOtp, normalizePhoneForWigal } from '@/lib/wigal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = String(body.phoneNumber || body.identifier || '').trim();
    const cleanToken = String(body.token || '').trim();
    const newPassword = String(body.newPassword || '').trim();

    if (!rawPhone || !cleanToken || !newPassword) {
      return NextResponse.json(
        { error: 'Phone number, verification code, and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanDigits = rawPhone.replace(/\D/g, '');
    const phoneSuffix = cleanDigits.length >= 9 ? cleanDigits.slice(-9) : cleanDigits;
    const formattedPhone = normalizePhoneForWigal(rawPhone);

    // Rate limiting: max 5 verify attempts per 10 minutes
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = rateLimit(`verify-forgot:${formattedPhone}:${ip}`, 5, 10 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Retrieve latest token record for this phone number
    const records = await db
      .select({
        id: verificationTokens.id,
        token: verificationTokens.token,
        expiresAt: verificationTokens.expiresAt,
        isUsed: verificationTokens.isUsed,
      })
      .from(verificationTokens)
      .where(
        or(
          eq(verificationTokens.phoneNumber, formattedPhone),
          eq(verificationTokens.phoneNumber, rawPhone),
          sql`REPLACE(REPLACE(REPLACE(REPLACE(${verificationTokens.phoneNumber}, ' ', ''), '-', ''), '+', ''), '(', '') LIKE ${'%' + phoneSuffix}`
        )
      )
      .orderBy(desc(verificationTokens.createdAt))
      .limit(1);

    let tokenVerified = false;
    let matchedRecordId: number | null = null;

    if (records.length > 0) {
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

      if (record.token === cleanToken) {
        tokenVerified = true;
        matchedRecordId = record.id;
      }
    }

    // If local record didn't match, verify directly against Frog API v3 OTP endpoint
    if (!tokenVerified) {
      const frogVerify = await verifyFrogOtp({
        destination: formattedPhone,
        code: cleanToken,
      });

      if (frogVerify.success) {
        tokenVerified = true;
      }
    }

    if (!tokenVerified) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check the 6-digit code and try again.' },
        { status: 400 }
      );
    }

    // Locate the user account linked to this phone number
    const matchingApps = await db
      .select({ userId: nssApplications.userId })
      .from(nssApplications)
      .where(
        sql`REPLACE(REPLACE(REPLACE(REPLACE(${nssApplications.phoneNumber}, ' ', ''), '-', ''), '+', ''), '(', '') LIKE ${'%' + phoneSuffix}`
      )
      .limit(1);

    if (matchingApps.length === 0) {
      return NextResponse.json(
        { error: 'Could not locate an account associated with this phone number.' },
        { status: 404 }
      );
    }

    const targetUserId = matchingApps[0].userId;

    // Hash the new password securely
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in users table
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, targetUserId));

    // Mark verification token as used if matched
    if (matchedRecordId) {
      await db
        .update(verificationTokens)
        .set({ isUsed: true })
        .where(eq(verificationTokens.id, matchedRecordId));
    }

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
