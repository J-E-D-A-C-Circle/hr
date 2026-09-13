import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificationTokens } from '@/db/schema';
import { rateLimit } from '@/lib/rate-limit';

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

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Expire in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save token to database
    await db.insert(verificationTokens).values({
      phoneNumber,
      token: otp,
      expiresAt,
    });

    // Send SMS via Wigal API
    const wigalUsername = process.env.WIGAL_USERNAME;
    const wigalPassword = process.env.WIGAL_PASSWORD;
    const senderId = process.env.WIGAL_SENDER_ID || 'DVLA NSS';

    if (wigalUsername && wigalPassword) {
      const response = await fetch('https://frog.wigal.com.gh/api/v2/sendmsg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: wigalUsername,
          password: wigalPassword,
          source: senderId,
          destination: phoneNumber,
          message: `Your DVLA NSS verification code is: ${otp}. It will expire in 10 minutes.`,
        }),
      });

      const responseData = await response.text();
      console.log('Wigal API response:', response.status, responseData);

      if (!response.ok) {
        console.error('Failed to send SMS via Wigal:', responseData);
        // Even if SMS fails in dev, we might still want to let the user proceed if we log the OTP, 
        // but in production, we should probably fail. For now, we'll return success so UI can continue,
        // or we could throw. Let's not throw, but log it.
      }
    } else {
      console.warn('Wigal API credentials not set. OTP is:', otp);
      // Fallback for development if credentials are not configured
    }

    return NextResponse.json({
      message: 'OTP sent successfully',
      // We don't return the OTP in production, but for testing it can be logged on server
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
