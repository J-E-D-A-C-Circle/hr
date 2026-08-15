import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, firstName, lastName, role } = body;

    const userEmail = String(email || '').trim().toLowerCase();
    const userFullName = full_name || `${firstName || ''} ${lastName || ''}`.trim();

    if (!userEmail || !password || !userFullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await query<any[]>(
      'SELECT id FROM users WHERE LOWER(email) = ?',
      [userEmail]
    );

    if (existing.length > 0) {
      const existingUser = existing[0];
      const apps = await query<any[]>(
        'SELECT status, additional_info FROM nss_applications WHERE user_id = ?',
        [existingUser.id]
      );
      const hasDraft = apps.length === 0 || apps[0].status === 'draft';

      return NextResponse.json(
        {
          error: 'User with this email already exists',
          exists: true,
          isDraft: hasDraft,
          user_email: userEmail,
        },
        { status: 409 }
      );
    }

    // Hash password and insert
    const passwordHash = await hashPassword(password);
    const userRole = role === 'admin' ? 'admin' : 'applicant';

    const result = await query<any>(
      'INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)',
      [userEmail, passwordHash, userRole, userFullName]
    );

    const userId = result.insertId;

    const tokenPayload = {
      user_id: userId,
      email: userEmail,
      role: userRole as 'applicant' | 'admin',
      full_name: userFullName,
    };

    const token = generateToken(tokenPayload);

    return NextResponse.json(
      {
        message: 'Registration successful',
        token,
        user: {
          id: userId,
          email: userEmail,
          role: userRole,
          full_name: userFullName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed: ' + (error.message || 'Database error') },
      { status: 500 }
    );
  }
}
