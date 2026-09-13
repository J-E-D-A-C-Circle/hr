import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificationTokens } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, token } = body;

    if (!phoneNumber || !token) {
      return NextResponse.json(
        { error: 'Phone number and token are required' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = rateLimit(`verify-otp:${phoneNumber}:${ip}`, 5, 10 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Find the latest active token for this phone number
    const records = await db
      .select({
        id: verificationTokens.id,
        token: verificationTokens.token,
        expiresAt: verificationTokens.expiresAt,
        isUsed: verificationTokens.isUsed,
      })
      .from(verificationTokens)
      .where(eq(verificationTokens.phoneNumber, phoneNumber))
      .orderBy(desc(verificationTokens.createdAt))
      .limit(1);

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No verification token found for this number.' },
        { status: 400 }
      );
    }

    const record = records[0];

    if (record.isUsed) {
      return NextResponse.json(
        { error: 'This verification token has already been used.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(record.expiresAt)) {
      return NextResponse.json(
        { error: 'This verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (record.token !== token) {
      return NextResponse.json(
        { error: 'Invalid verification token.' },
        { status: 400 }
      );
    }

    // Mark as used
    await db
      .update(verificationTokens)
      .set({ isUsed: true })
      .where(eq(verificationTokens.id, record.id));

    return NextResponse.json({
      message: 'Phone number verified successfully',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
