import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, submissions } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import JSZip from 'jszip';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'ALL';
    const month = searchParams.get('month') && searchParams.get('month') !== 'ALL' ? parseInt(searchParams.get('month')!) : undefined;
    const quarter = searchParams.get('quarter') || undefined;
    const year = searchParams.get('year') && searchParams.get('year') !== 'ALL' ? parseInt(searchParams.get('year')!) : undefined;
    const branchId = searchParams.get('branchId') || undefined;
    const department = searchParams.get('department') || undefined;
    const status = searchParams.get('status') || 'ALL';
    const staffType = searchParams.get('staffType') || 'ALL';

    const conditions: any[] = [];
    if (branchId && branchId !== 'ALL') conditions.push(eq(submissions.branchId, branchId));
    if (month) conditions.push(eq(submissions.month, month));
    if (year) conditions.push(eq(submissions.year, year));
    if (status && status !== 'ALL') conditions.push(eq(submissions.status, status));
    if (staffType && staffType !== 'ALL') conditions.push(eq(submissions.staffType, staffType));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let subList = await db.query.submissions.findMany({
      where: whereClause,
      with: {
        branch: { with: { region: true } },
        uploadedBy: { columns: { name: true, email: true } },
        reviewer: { columns: { name: true, email: true } },
      },
      orderBy: [desc(submissions.year), desc(submissions.month), desc(submissions.uploadedAt)],
    });

    if (!month && timeframe === 'QUARTER' && quarter) {
      const quarterMonthsMap: Record<string, number[]> = {
        Q1: [1, 2, 3],
        Q2: [4, 5, 6],
        Q3: [7, 8, 9],
        Q4: [10, 11, 12],
      };
      const allowedMonths = quarterMonthsMap[quarter] || [];
      if (allowedMonths.length > 0) {
        subList = subList.filter((s: any) => allowedMonths.includes(s.month));
      }
    }

    if (department && department !== 'ALL' && (!staffType || staffType === 'ALL')) {
      if (['PERMANENT', 'CONTRACT'].includes(department)) {
        subList = subList.filter((s: any) => s.staffType === department);
      } else {
        const depLower = department.toLowerCase();
        subList = subList.filter((s: any) => s.note?.toLowerCase().includes(depLower));
      }
    }

    const zip = new JSZip();
    const manifestRows: any[] = [];
    const filesFolder = zip.folder('pdf_scans');

    for (const sub of subList) {
      let parsedNote: any = {};
      try {
        if (sub.note && sub.note.startsWith('{')) {
          parsedNote = JSON.parse(sub.note);
        }
      } catch (e) {}

      const monthName = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ][sub.month - 1] || `Month_${sub.month}`;

      const staffTypeLabel =
        sub.staffType === 'CONTRACT'
          ? 'Contract Staff'
          : sub.staffType === 'BOTH'
          ? 'Permanent & Contract Staff'
          : 'Permanent Staff';

      manifestRows.push({
        'Submission ID': sub.id,
        'Station Name': sub.branch?.name || 'Unknown',
        'Station Code': sub.branch?.code || 'N/A',
        'Region': sub.branch?.region?.name || 'N/A',
        'Month': monthName,
        'Year': sub.year,
        'Staff Category': staffTypeLabel,
        'Signer Name': parsedNote.signerName || 'N/A',
        'Status': sub.status,
        'File Name': sub.fileName,
        'Uploaded Date': new Date(sub.uploadedAt || '').toLocaleString(),
        'Uploaded By': sub.uploadedBy?.name || sub.uploadedBy?.email || 'N/A',
        'Reviewed Date': sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleString() : 'N/A',
        'Reviewer Name': sub.reviewer?.name || 'N/A',
        'Reviewer Notes': sub.reviewerNotes || 'None',
      });

      let fullPath = path.join(process.cwd(), 'uploads', sub.fileName);
      if (!fs.existsSync(fullPath)) {
        fullPath = path.join(/*turbopackIgnore: true*/ process.cwd(), sub.filePath);
      }

      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath);
        const zipFileName = `${sub.branch?.code || 'STATION'}_${sub.year}_M${String(sub.month).padStart(2, '0')}_${sub.fileName}`;
        filesFolder?.file(zipFileName, fileContent);
      }
    }

    const csvString = Papa.unparse(manifestRows);
    zip.file('audit_summary_manifest.csv', csvString);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    let downloadName = `Audit_Records_${timeframe}`;
    if (timeframe === 'MONTH' && month && year) downloadName += `_${year}_M${month}`;
    else if (timeframe === 'QUARTER' && quarter && year) downloadName += `_${year}_${quarter}`;
    else if (timeframe === 'YEAR' && year) downloadName += `_${year}`;
    downloadName += `_${Date.now()}.zip`;

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating audit ZIP archive:', error);
    return NextResponse.json({ error: 'Failed to generate audit ZIP archive' }, { status: 500 });
  }
}
