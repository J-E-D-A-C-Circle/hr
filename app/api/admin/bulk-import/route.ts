import { NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

      // Upsert region
      const regionCode = `REG-${regionName.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
      const region = await prisma.region.upsert({
        where: { code: regionCode },
        update: { name: regionName },
        create: { name: regionName, code: regionCode },
      });

      // Upsert branch
      const branch = await prisma.branch.upsert({
        where: { code: branchCode },
        update: { name: branchName, regionId: region.id, headName, headEmail },
        create: {
          code: branchCode,
          name: branchName,
          regionId: region.id,
          headName,
          headEmail,
          active: true,
        },
      });
      importedBranches++;

      // Password logic
      const passHash = r.initial_password ? await hashPassword(r.initial_password.trim()) : defaultPasswordHash;

      // Upsert Station Manager user account
      await prisma.user.upsert({
        where: { email: headEmail },
        update: { name: headName, branchId: branch.id, role: 'STATION_MANAGER' },
        create: {
          name: headName,
          email: headEmail,
          passwordHash: passHash,
          role: 'STATION_MANAGER',
          branchId: branch.id,
        },
      });
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
