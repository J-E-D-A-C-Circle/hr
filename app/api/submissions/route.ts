import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    const regionId = searchParams.get('regionId') || undefined;
    const branchId = searchParams.get('branchId') || undefined;
    const query = searchParams.get('q') || undefined;

    // Scope rules: If authenticated as Station Manager, force their own branch
    let effectiveBranchId = branchId;
    if (session && session.role === 'STATION_MANAGER') {
      effectiveBranchId = session.branchId || branchId;
    }

    const where: any = {};
    if (month) where.month = month;
    if (year) where.year = year;
    if (status && status !== 'ALL') where.status = status;
    if (effectiveBranchId) where.branchId = effectiveBranchId;
    if (regionId && regionId !== 'ALL') {
      where.branch = { regionId };
    }
    if (query) {
      where.OR = [
        { branch: { name: { contains: query } } },
        { branch: { code: { contains: query } } },
        { note: { contains: query } },
      ];
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        branch: {
          include: { region: true },
        },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { uploadedAt: 'desc' }],
    });

    return NextResponse.json({ submissions });
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

    // Check size limit: 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum 15MB limit' }, { status: 400 });
    }

    // Validate mime type / filename
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { users: true },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Determine uploader ID (session user or station user fallback)
    let uploaderId = session?.id;
    if (!uploaderId) {
      const stationUser = branch.users[0] || (await prisma.user.findFirst({ where: { role: 'HR_ADMIN' } }));
      if (!stationUser) {
        return NextResponse.json({ error: 'No uploader account available for this branch' }, { status: 400 });
      }
      uploaderId = stationUser.id;
    }

    // Check if month already approved
    const existingApproved = await prisma.submission.findFirst({
      where: { branchId, month, year, status: 'APPROVED' },
    });

    if (existingApproved) {
      return NextResponse.json(
        { error: `Validation for ${month}/${year} has already been Approved and cannot be overwritten.` },
        { status: 400 }
      );
    }

    // Check for prior submission to link resubmission
    const priorSubmission = await prisma.submission.findFirst({
      where: { branchId, month, year },
      orderBy: { createdAt: 'desc' },
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Run OCR Legibility check
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

    // Ensure uploads folder exists
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeBranchCode = branch.code.replace(/[^a-zA-Z0-9-]/g, '_');
    const fileName = `payroll_${safeBranchCode}_${year}_${String(month).padStart(2, '0')}_${timestamp}.pdf`;
    const fullFilePath = path.join(uploadDir, fileName);
    const relativeFilePath = `uploads/${fileName}`;

    fs.writeFileSync(fullFilePath, fileBuffer);

    const isResubmission = !!priorSubmission;

    const newSubmission = await prisma.submission.create({
      data: {
        branchId,
        month,
        year,
        fileName,
        filePath: relativeFilePath,
        fileSize: file.size,
        note: note.slice(0, 500),
        uploadedById: uploaderId,
        uploadedAt: new Date(),
        status: 'PENDING',
        resubmissionOfId: priorSubmission?.id || null,
        ocrPassed: ocrResult.passed,
        ocrText: ocrResult.text.slice(0, 1000),
      },
      include: {
        branch: true,
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

    return NextResponse.json({ success: true, submission: newSubmission });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: 'Failed to process document upload' }, { status: 500 });
  }
}
