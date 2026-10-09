import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
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

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await ensureSupportTable();

    const tickets = await query<any[]>(
      `SELECT id, name, contact, message, status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
       FROM support_tickets 
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ tickets: tickets || [] });
  } catch (error: any) {
    console.error('Fetch support tickets error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch support tickets.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const id = Number(body.id);
    const status = String(body.status || 'open').trim();

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Valid ticket ID is required.' }, { status: 400 });
    }

    await ensureSupportTable();

    await query(`UPDATE support_tickets SET status = ? WHERE id = ?`, [status, id]);

    const tickets = await query<any[]>(
      `SELECT id, name, contact, message, status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
       FROM support_tickets 
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ tickets: tickets || [], message: 'Ticket status updated successfully.' });
  } catch (error: any) {
    console.error('Update support ticket error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update ticket status.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Valid ticket ID is required.' }, { status: 400 });
    }

    await ensureSupportTable();

    await query(`DELETE FROM support_tickets WHERE id = ?`, [id]);

    const tickets = await query<any[]>(
      `SELECT id, name, contact, message, status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
       FROM support_tickets 
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ tickets: tickets || [], message: 'Ticket deleted successfully.' });
  } catch (error: any) {
    console.error('Delete support ticket error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete ticket.' }, { status: 500 });
  }
}
