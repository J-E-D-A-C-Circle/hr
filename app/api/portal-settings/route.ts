import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function ensureSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export async function GET() {
  try {
    await ensureSettingsTable();
    const rows = await query<{ setting_key: string; setting_value: string }[]>(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_key = 'applications_closed' LIMIT 1`
    );

    const applicationsClosed =
      rows && rows.length > 0
        ? rows[0].setting_value === 'true' || rows[0].setting_value === '1'
        : false;

    return NextResponse.json({
      applicationsClosed,
    });
  } catch (error: any) {
    console.warn('Error reading portal settings from DB, using default:', error.message);
    return NextResponse.json({
      applicationsClosed: false,
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSettingsTable();
    const body = await request.json();
    const closed = Boolean(body.applicationsClosed);
    const valueString = closed ? 'true' : 'false';

    await query(
      `INSERT INTO system_settings (setting_key, setting_value)
       VALUES ('applications_closed', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [valueString]
    );

    return NextResponse.json({
      success: true,
      applicationsClosed: closed,
      message: closed
        ? 'Applications intake has been CLOSED for 2026/2027 NSS personnel.'
        : 'Applications intake has been OPENED.',
    });
  } catch (error: any) {
    console.error('Error updating portal settings:', error);
    return NextResponse.json(
      { error: 'Failed to update portal settings: ' + error.message },
      { status: 500 }
    );
  }
}
