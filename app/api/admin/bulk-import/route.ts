import { NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { db, branches, regions, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logAuditAction } from '@/lib/audit';
import Papa from 'papaparse';

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
      let reg = await db.query.regions.findFirst({ where: eq(regions.code, regionCode) });
      if (!reg) {
        reg = db.insert(regions).values({ name: regionName, code: regionCode }).returning().get();
      }

      let branch = await db.query.branches.findFirst({ where: eq(branches.name, branchName) });
      if (branch) {
        db.update(branches)
          .set({ code: branchCode, regionId: reg.id, headName, headEmail, updatedAt: new Date().toISOString() })
          .where(eq(branches.id, branch.id))
          .run();
        branch = (await db.query.branches.findFirst({ where: eq(branches.id, branch.id) }))!;
      } else {
        branch = db
          .insert(branches)
          .values({ code: branchCode, name: branchName, regionId: reg.id, headName, headEmail, active: true })
          .returning()
          .get();
      }
      importedBranches++;

      const passHash = r.initial_password ? await hashPassword(r.initial_password.trim()) : defaultPasswordHash;

      let usr = await db.query.users.findFirst({ where: eq(users.email, headEmail) });
      if (usr) {
        db.update(users)
          .set({ name: headName, branchId: branch.id, role: 'STATION_MANAGER', updatedAt: new Date().toISOString() })
          .where(eq(users.id, usr.id))
          .run();
      } else {
        db.insert(users)
          .values({
            name: headName,
            email: headEmail,
            passwordHash: passHash,
            role: 'STATION_MANAGER',
            branchId: branch.id,
          })
          .run();
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
