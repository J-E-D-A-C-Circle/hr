import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission file not found' }, { status: 404 });
    }

    // Role check: Station Managers can only view their own branch files
    if (session.role === 'STATION_MANAGER' && session.branchId !== submission.branchId) {
      return NextResponse.json({ error: 'Access denied to other branch documents' }, { status: 403 });
    }

    const fileName = path.basename(submission.filePath);
    const fullPath = path.join(process.cwd(), 'uploads', fileName);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Physical PDF file missing from volume storage' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${submission.fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving submission file:', error);
    return NextResponse.json({ error: 'Error serving document stream' }, { status: 500 });
  }
}
