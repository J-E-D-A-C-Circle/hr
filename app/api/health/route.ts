import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get('deep') === '1';

  if (deep) {
    try {
      await db.execute(sql`SELECT 1`);
      return NextResponse.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch {
      return NextResponse.json({ status: 'degraded', database: 'disconnected' }, { status: 503 });
    }
  }

  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
