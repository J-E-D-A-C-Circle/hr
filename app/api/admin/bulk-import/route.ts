import { NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { db, branches, regions, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logAuditAction } from '@/lib/audit';
import Papa from 'papaparse';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const csvTextParam = formData.get('csvText') as string | null;

    let csvContent = '';
    if (file) {
      csvContent = await file.text();
    } else if (csvTextParam) {
      csvContent = csvTextParam;
    } else {
      return NextResponse.json({ error: 'Please attach a CSV file or provide CSV content' }, { status: 400 });
    }

    const parsed = Papa.parse<{
      branch_code: string;
      branch_name: string;
      region_name: string;
      head_name: string;
      head_email: string;
      initial_password?: string;
    }>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: 'Failed to parse CSV document' }, { status: 400 });
    }

    const rows = parsed.data;
    let importedBranches = 0;
    let importedUsers = 0;
    const defaultPasswordHash = await hashPassword('password123');

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.branch_name || !r.head_email) continue;

      const branchCode = r.branch_code ? r.branch_code.trim() : `BR-${String(i + 1).padStart(3, '0')}`;
      const branchName = r.branch_name.trim();
      const regionName = r.region_name ? r.region_name.trim() : 'Central Region';
      const headName = r.head_name ? r.head_name.trim() : 'Station Head';
      const headEmail = r.head_email.trim().toLowerCase();

      const regionCode = `REG-${regionName.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
      const existingReg = await db.query.regions.findFirst({ where: eq(regions.code, regionCode) });
      let regId = existingReg?.id;
      if (!regId) {
        regId = crypto.randomUUID();
        await db.insert(regions).values({ id: regId, name: regionName, code: regionCode });
      }

      const existingBranch = await db.query.branches.findFirst({ where: eq(branches.name, branchName) });
      let branchId: string;
      if (existingBranch) {
        branchId = existingBranch.id;
        await db.update(branches)
          .set({ code: branchCode, regionId: regId, headName, headEmail, updatedAt: new Date().toISOString() })
          .where(eq(branches.id, existingBranch.id));
      } else {
        branchId = crypto.randomUUID();
        await db.insert(branches).values({ id: branchId, code: branchCode, name: branchName, regionId: regId, headName, headEmail, active: true });
      }
      importedBranches++;

      const passHash = r.initial_password ? await hashPassword(r.initial_password.trim()) : defaultPasswordHash;

      const existingUser = await db.query.users.findFirst({ where: eq(users.email, headEmail) });
      if (existingUser) {
        await db.update(users)
          .set({ name: headName, branchId: branchId, role: 'STATION_MANAGER', updatedAt: new Date().toISOString() })
          .where(eq(users.id, existingUser.id));
      } else {
        await db.insert(users)
          .values({
            id: crypto.randomUUID(),
            name: headName,
            email: headEmail,
            passwordHash: passHash,
            role: 'STATION_MANAGER',
            branchId: branchId,
          });
      }
      importedUsers++;
    }

    await logAuditAction({
      actorId: session.id,
      action: 'BULK_IMPORT',
      targetType: 'SYSTEM',
      metadata: { importedBranches, importedUsers },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed CSV bulk import: ${importedBranches} branches and ${importedUsers} branch head accounts.`,
      importedBranches,
      importedUsers,
    });
  } catch (error) {
    console.error('CSV bulk import error:', error);
    return NextResponse.json({ error: 'Error executing CSV bulk import' }, { status: 500 });
  }
}
