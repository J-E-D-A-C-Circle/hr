import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function ensureSupportTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const rawPhone = String(body.contact || body.phone_number || '').trim();
    const contact = rawPhone.replace(/[\s\-()]/g, '').replace(/^\+/, '');
    const message = String(body.message || body.issue_description || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Please provide your name.' }, { status: 400 });
    }

    if (!contact) {
      return NextResponse.json({ error: 'Please provide your phone number.' }, { status: 400 });
    }

    if (!/^[0-9]{10,15}$/.test(contact)) {
      return NextResponse.json({ error: 'Please provide a valid phone number (digits only).' }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: 'Please describe your issue.' }, { status: 400 });
    }

    await ensureSupportTable();

    await query(
      `INSERT INTO support_tickets (name, contact, message, status) VALUES (?, ?, ?, 'open')`,
      [name, contact, message]
    );

    return NextResponse.json({
      success: true,
      message: 'Support request submitted successfully. Our technical team will get back to you shortly.',
    });
  } catch (error: any) {
    console.error('Support ticket submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit support request.' },
      { status: 500 }
    );
  }
}
