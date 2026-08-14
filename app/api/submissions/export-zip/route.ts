import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    const timeframe = searchParams.get('timeframe') || 'ALL'; // MONTH | QUARTER | YEAR | ALL
    const month = searchParams.get('month') && searchParams.get('month') !== 'ALL' ? parseInt(searchParams.get('month')!) : undefined;
    const quarter = searchParams.get('quarter') || undefined; // Q1, Q2, Q3, Q4
    const year = searchParams.get('year') && searchParams.get('year') !== 'ALL' ? parseInt(searchParams.get('year')!) : undefined;
    const branchId = searchParams.get('branchId') || undefined;
    const department = searchParams.get('department') || undefined;
    const status = searchParams.get('status') || 'ALL';
    const staffType = searchParams.get('staffType') || 'ALL';

    const where: any = {};

    // Station Branch filter
    if (branchId && branchId !== 'ALL') {
      where.branchId = branchId;
    }

    // Month filter
    if (month) {
      where.month = month;
    }

    // Year filter
    if (year) {
      where.year = year;
    }

    // Quarter filter (if month is not explicitly set)
    if (!month && timeframe === 'QUARTER' && quarter) {
      if (quarter === 'Q1') where.month = { in: [1, 2, 3] };
      else if (quarter === 'Q2') where.month = { in: [4, 5, 6] };
      else if (quarter === 'Q3') where.month = { in: [7, 8, 9] };
      else if (quarter === 'Q4') where.month = { in: [10, 11, 12] };
    }

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Staff Type / Department filter
    if (staffType && staffType !== 'ALL') {
      where.staffType = staffType;
    } else if (department && department !== 'ALL') {
      if (['PERMANENT', 'CONTRACT', 'BOTH'].includes(department)) {
        where.staffType = department;
      } else {
        where.note = { contains: department };
      }
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        branch: {
          include: { region: true },
        },
        uploadedBy: {
          select: { name: true, email: true },
        },
        reviewer: {
          select: { name: true, email: true },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { uploadedAt: 'desc' }],
    });

    const zip = new JSZip();
    const manifestRows: any[] = [];
    const filesFolder = zip.folder('pdf_scans');

    for (const sub of submissions) {
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
        'Station Name': sub.branch.name,
        'Station Code': sub.branch.code,
        'Region': sub.branch.region.name,
        'Month': monthName,
        'Year': sub.year,
        'Staff Category': staffTypeLabel,
        'Employee Count': parsedNote.employeeCount || 'N/A',
        'Total Payroll (GH₵)': parsedNote.payrollAmount || 'N/A',
        'Signer Name': parsedNote.signerName || 'N/A',
        'Status': sub.status,
        'File Name': sub.fileName,
        'Uploaded Date': new Date(sub.uploadedAt).toLocaleString(),
        'Uploaded By': sub.uploadedBy.name,
        'Reviewed Date': sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleString() : 'N/A',
        'Reviewer Name': sub.reviewer?.name || 'N/A',
        'Reviewer Notes': sub.reviewerNotes || 'None',
      });

      // Attach file to ZIP if available on disk
      let fullPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads', sub.fileName);
      if (!fs.existsSync(fullPath)) {
        fullPath = path.join(/*turbopackIgnore: true*/ process.cwd(), sub.filePath);
      }

      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath);
        const zipFileName = `${sub.branch.code}_${sub.year}_M${String(sub.month).padStart(2, '0')}_${sub.fileName}`;
        filesFolder?.file(zipFileName, fileContent);
      }
    }

    // Add Master Manifest Spreadsheet to ZIP
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
