import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, submissions, branches, users } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { checkPDFLegibility } from '@/lib/ocr';
import { logAuditAction } from '@/lib/audit';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const status = searchParams.get('status') || undefined;
    const staffType = searchParams.get('staffType') || undefined;
    const regionId = searchParams.get('regionId') || undefined;
    const branchId = searchParams.get('branchId') || undefined;
    const query = searchParams.get('q') || undefined;

    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    let effectiveBranchId = branchId;
    if (session && session.role === 'STATION_MANAGER') {
      effectiveBranchId = session.branchId || branchId;
    }

    const conditions: any[] = [];
    if (month) conditions.push(eq(submissions.month, month));
    if (year) conditions.push(eq(submissions.year, year));
    if (status && status !== 'ALL') conditions.push(eq(submissions.status, status));
    if (staffType && staffType !== 'ALL') conditions.push(eq(submissions.staffType, staffType));
    if (effectiveBranchId) conditions.push(eq(submissions.branchId, effectiveBranchId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let allSubmissions = await db.query.submissions.findMany({
      where: whereClause,
      with: {
        branch: {
          with: { region: true },
        },
        uploadedBy: {
          columns: { id: true, name: true, email: true },
        },
        reviewer: {
          columns: { id: true, name: true, email: true },
        },
      },
      orderBy: [desc(submissions.year), desc(submissions.month), desc(submissions.uploadedAt)],
    });

    if (regionId && regionId !== 'ALL') {
      allSubmissions = allSubmissions.filter((s: any) => s.branch?.regionId === regionId);
    }

    if (query) {
      const qLower = query.toLowerCase();
      allSubmissions = allSubmissions.filter(
        (s: any) =>
          s.branch?.name.toLowerCase().includes(qLower) ||
          s.branch?.code?.toLowerCase().includes(qLower) ||
          s.note?.toLowerCase().includes(qLower)
      );
    }

    const totalCount = allSubmissions.length;
    const startIndex = (page - 1) * limit;
    const paginatedSubmissions = limit > 0 ? allSubmissions.slice(startIndex, startIndex + limit) : allSubmissions;

    return NextResponse.json({
      submissions: paginatedSubmissions,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const month = parseInt(formData.get('month') as string);
    const year = parseInt(formData.get('year') as string);
    const note = (formData.get('note') as string) || '';
    const confirmOcrOverride = formData.get('confirmOcrOverride') === 'true';
    let branchId = (formData.get('branchId') as string) || session?.branchId;

    if (!branchId) {
      return NextResponse.json({ error: 'Please select a station branch for upload' }, { status: 400 });
    }

    if (!file || !month || !year) {
      return NextResponse.json({ error: 'File, month, and year are required' }, { status: 400 });
    }

    const MAX_SIZE = 30 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum 30MB limit' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 });
    }

    const branch = await db.query.branches.findFirst({
      where: eq(branches.id, branchId),
      with: { users: true },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    let uploaderId = session?.id;
    if (!uploaderId) {
      const hrAdmin = await db.query.users.findFirst({ where: eq(users.role, 'HR_ADMIN') });
      const stationUser = branch.users[0] || hrAdmin;
      if (!stationUser) {
        return NextResponse.json({ error: 'No uploader account available for this branch' }, { status: 400 });
      }
      uploaderId = stationUser.id;
    }

    const existingApproved = await db.query.submissions.findFirst({
      where: and(
        eq(submissions.branchId, branchId),
        eq(submissions.month, month),
        eq(submissions.year, year),
        eq(submissions.status, 'APPROVED')
      ),
    });

    if (existingApproved) {
      return NextResponse.json(
        { error: `Validation for ${month}/${year} has already been Approved and cannot be overwritten.` },
        { status: 400 }
      );
    }

    const priorSubmission = await db.query.submissions.findFirst({
      where: and(eq(submissions.branchId, branchId), eq(submissions.month, month), eq(submissions.year, year)),
      orderBy: [desc(submissions.createdAt)],
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    if (fileBuffer.length < 5 || fileBuffer.toString('utf-8', 0, 5) !== '%PDF-') {
      return NextResponse.json({ error: 'Uploaded file is not a valid PDF document' }, { status: 400 });
    }

    const ocrResult = await checkPDFLegibility(fileBuffer);
    if (!ocrResult.passed && !confirmOcrOverride) {
      return NextResponse.json(
        {
          error: 'OCR_WARNING',
          warning: ocrResult.warning,
          charCount: ocrResult.charCount,
          message: 'The uploaded scan has very minimal readable text. Click "Proceed Anyway" if you confirm the document is complete.',
        },
        { status: 422 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeBranchCode = (branch.code || branch.name).replace(/[^a-zA-Z0-9-]/g, '_');
    const fileName = `payroll_${safeBranchCode}_${year}_${String(month).padStart(2, '0')}_${timestamp}.pdf`;
    const fullFilePath = path.join(uploadDir, fileName);
    const relativeFilePath = `uploads/${fileName}`;

    fs.writeFileSync(fullFilePath, fileBuffer);

    const isResubmission = !!priorSubmission;
    let staffType = (formData.get('staffType') as string) || 'PERMANENT';
    try {
      if (note && note.startsWith('{')) {
        const parsedNote = JSON.parse(note);
        if (parsedNote.staffType) staffType = parsedNote.staffType;
      }
    } catch (e) {}

    const newSubmission = db
      .insert(submissions)
      .values({
        branchId,
        month,
        year,
        fileName,
        filePath: relativeFilePath,
        fileSize: file.size,
        note: note.slice(0, 500),
        uploadedById: uploaderId,
        uploadedAt: new Date().toISOString(),
        status: 'PENDING',
        resubmissionOfId: priorSubmission?.id || null,
        ocrPassed: ocrResult.passed,
        ocrText: ocrResult.text.slice(0, 1000),
        staffType,
      })
      .returning()
      .get();

    const fullNewSubmission = await db.query.submissions.findFirst({
      where: eq(submissions.id, newSubmission.id),
      with: {
        branch: { with: { region: true } },
        uploadedBy: { columns: { id: true, name: true, email: true } },
      },
    });

    await logAuditAction({
      actorId: uploaderId,
      action: isResubmission ? 'RESUBMIT' : 'UPLOAD',
      targetType: 'SUBMISSION',
      targetId: newSubmission.id,
      metadata: {
        branch: branch.name,
        month,
        year,
        fileName,
        fileSize: file.size,
        ocrPassed: ocrResult.passed,
      },
    });

    return NextResponse.json({ success: true, submission: fullNewSubmission || newSubmission });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: 'Failed to process document upload' }, { status: 500 });
  }
}
