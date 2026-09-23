import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, nssApplications, verificationTokens } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';
import nodemailer from 'nodemailer';
import { sendWigalSms } from '@/lib/wigal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, identifier } = body; // method: 'email' | 'phone'

    if (!method || !['email', 'phone'].includes(method)) {
      return NextResponse.json(
        { error: 'Valid method (email or phone) is required.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = String(identifier || '').trim();

    if (!cleanIdentifier) {
      return NextResponse.json(
        { error: method === 'email' ? 'Email address is required.' : 'Phone number is required.' },
        { status: 400 }
      );
    }

    if (method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanIdentifier)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }
    } else {
      // Basic phone format validation
      const cleanPhone = cleanIdentifier.replace(/[\s\-\(\)\+]/g, '');
      if (cleanPhone.length < 9) {
        return NextResponse.json(
          { error: 'Please enter a valid phone number.' },
          { status: 400 }
        );
      }
    }

    // Check if user exists with this email or phone number
    let userFound = false;

    if (method === 'email') {
      const lowerEmail = cleanIdentifier.toLowerCase();
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`LOWER(${users.email}) = ${lowerEmail}`);

      if (existingUser.length > 0) {
        userFound = true;
      } else {
        // Check if there is an application with this email
        const existingApp = await db
          .select({ id: nssApplications.id })
          .from(nssApplications)
          .where(sql`LOWER(${nssApplications.email}) = ${lowerEmail}`);
        if (existingApp.length > 0) {
          userFound = true;
        }
      }
    } else {
      // Clean phone check in applications
      const cleanDigits = cleanIdentifier.replace(/\D/g, '');
      const existingApps = await db
        .select({ id: nssApplications.id })
        .from(nssApplications)
        .where(sql`REPLACE(REPLACE(REPLACE(${nssApplications.phoneNumber}, ' ', ''), '-', ''), '+', '') LIKE ${'%' + cleanDigits}`);

      if (existingApps.length > 0) {
        userFound = true;
      } else {
        // Also check if users table might have phone numbers or fallback
        userFound = true; // Allow proceeding so security doesn't leak user enumeration easily if desired
      }
    }

    if (!userFound) {
      return NextResponse.json(
        { error: `No registered account found with this ${method === 'email' ? 'email address' : 'phone number'}.` },
        { status: 404 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = rateLimit(`forgot-pass:${cleanIdentifier}:${ip}`, 3, 15 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in verification_tokens
    await db.insert(verificationTokens).values({
      phoneNumber: cleanIdentifier, // storing either phone number or email address
      token: otp,
      expiresAt,
    });

    // Send code via Phone (Frog Wigal SMS) or Email (Nodemailer)
    if (method === 'phone') {
      await sendWigalSms({
        destination: cleanIdentifier,
        message: `Your DVLA NSS password reset code is: ${otp}. Valid for 10 minutes.`,
      });
    } else {
      // Email delivery
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || '"DVLA NSS Portal" <no-reply@dvla.gov.gh>',
            to: cleanIdentifier,
            subject: 'DVLA NSS Portal - Password Reset Verification Code',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; rounded-lg: 12px;">
                <h2 style="color: #16a34a; margin-bottom: 8px;">DVLA NSS Portal</h2>
                <h3 style="margin-top: 0;">Password Reset Verification Code</h3>
                <p>You requested a password reset for your DVLA NSS account.</p>
                <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #15803d; border-radius: 8px; margin: 20px 0;">
                  ${otp}
                </div>
                <p style="font-size: 14px; color: #6b7280;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error('[Forgot Password] Email sending error:', emailErr);
        }
      }
      console.log(`[Forgot Password] Email OTP for ${cleanIdentifier}: ${otp}`);
    }

    return NextResponse.json({
      message: `Verification code sent to your ${method === 'email' ? 'email' : 'phone number'}.`,
      method,
      target: cleanIdentifier,
      // Pass debug code in dev mode for convenient testing if needed
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
