import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificationTokens } from '@/db/schema';
import { rateLimit } from '@/lib/rate-limit';
import { sendWigalSms, generateFrogOtp } from '@/lib/wigal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = rateLimit(`send-otp:${phoneNumber}:${ip}`, 3, 15 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many SMS requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate local 6-digit OTP token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`🔑 [OTP GENERATED] Verification code for ${phoneNumber}: ${otp}`);

    // Save token to local database for fast & resilient verification
    await db.insert(verificationTokens).values({
      phoneNumber,
      token: otp,
      expiresAt,
    });

    // Send via Frog v3 OTP Generate API first, fallback to Frog v3 Quick SMS
    let smsResult = await generateFrogOtp({
      destination: phoneNumber,
      senderId: 'DVLA NSS',
      expiryMinutes: 10,
      length: 6,
      messageTemplate: 'Your DVLA NSS verification code is : %OTPCODE%. It will expire after %EXPIRY% mins',
    });

    if (!smsResult.success) {
      console.warn('⚠️ [OTP Generate] v3 OTP Endpoint returned non-success, attempting v3 Quick SMS fallback...');
      smsResult = await sendWigalSms({
        destination: phoneNumber,
        message: `Your DVLA NSS verification code is: ${otp}. Valid for 10 minutes.`,
        senderId: 'DVLA NSS',
      });
    }

    return NextResponse.json({
      message: 'OTP sent successfully',
      formattedNumber: smsResult.formattedNumber,
      smsDelivered: smsResult.success,
      smsResponse: smsResult.data,
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
