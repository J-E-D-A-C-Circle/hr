import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nssApplications, verificationTokens, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';
import { sendWigalSms, generateFrogOtp, normalizePhoneForWigal } from '@/lib/wigal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawInput = String(body.phoneNumber || body.identifier || '').trim();

    if (!rawInput) {
      return NextResponse.json(
        { error: 'Mobile phone number is required.' },
        { status: 400 }
      );
    }

    // Extract digits and validate length
    const cleanDigits = rawInput.replace(/\D/g, '');
    if (cleanDigits.length < 9) {
      return NextResponse.json(
        { error: 'Please enter a valid mobile phone number (at least 9 digits).' },
        { status: 400 }
      );
    }

    // Standardize to Ghanaian 10-digit mobile number (e.g. 024XXXXXXX)
    const formattedPhone = normalizePhoneForWigal(rawInput);
    const phoneSuffix = cleanDigits.slice(-9);

    // Look for matching user in nss_applications
    const matchingApps = await db
      .select({
        id: nssApplications.id,
        userId: nssApplications.userId,
        firstName: nssApplications.firstName,
        phoneNumber: nssApplications.phoneNumber,
      })
      .from(nssApplications)
      .where(
        sql`REPLACE(REPLACE(REPLACE(REPLACE(${nssApplications.phoneNumber}, ' ', ''), '-', ''), '+', ''), '(', '') LIKE ${'%' + phoneSuffix}`
      )
      .limit(1);

    if (matchingApps.length === 0) {
      return NextResponse.json(
        { error: 'No account found associated with this mobile phone number. Please check the number and try again.' },
        { status: 404 }
      );
    }

    // Rate limiting: max 4 attempts per 15 minutes per phone/IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = rateLimit(`forgot-pass:${formattedPhone}:${ip}`, 4, 15 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts for this number. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Generate secure 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    console.log(`🔑 [Forgot Password OTP] Generated code ${otp} for ${formattedPhone}`);

    // Store in verification_tokens
    await db.insert(verificationTokens).values({
      phoneNumber: formattedPhone,
      token: otp,
      expiresAt,
    });

    // Send SMS via Frog Wigal SMS API v3
    let smsSuccess = false;
    let smsResult = await sendWigalSms({
      destination: formattedPhone,
      message: `Your DVLA NSS password reset code is: ${otp}. Valid for 10 minutes.`,
      senderId: 'DVLA NSS',
    });

    console.log(`📱 [Forgot Password SMS] Wigal send result:`, smsResult);

    if (smsResult.success) {
      smsSuccess = true;
    } else {
      console.warn('⚠️ [Forgot Password SMS] Quick SMS send failed, attempting Frog OTP generate fallback...');
      const otpGenResult = await generateFrogOtp({
        destination: formattedPhone,
        senderId: 'DVLA NSS',
        expiryMinutes: 10,
        length: 6,
        messageTemplate: `Your DVLA NSS password reset code is : %OTPCODE%. Valid for %EXPIRY% mins`,
      });
      console.log(`📱 [Forgot Password SMS] Fallback Frog OTP generate result:`, otpGenResult);
      if (otpGenResult.success) {
        smsSuccess = true;
      }
    }

    return NextResponse.json({
      message: 'A 6-digit verification code has been sent to your phone via SMS.',
      phoneNumber: formattedPhone,
      smsDelivered: smsSuccess,
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error: any) {
    console.error('[Forgot Password] Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code: ' + (error.message || 'Server error') },
      { status: 500 }
    );
  }
}
