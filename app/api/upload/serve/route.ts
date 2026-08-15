import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePathParam = searchParams.get('path');
    const tokenParam = searchParams.get('token');

    const authHeader = request.headers.get('authorization');
    const token = tokenParam || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

    if (!token) {
      return new NextResponse('Unauthorized: Token required', { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return new NextResponse('Unauthorized: Invalid token', { status: 401 });
    }

    if (!filePathParam) {
      return new NextResponse('Bad Request: File path required', { status: 400 });
    }

    // Sanitize path to prevent directory traversal
    const sanitizedPath = filePathParam.replace(/\.\./g, '');
    const fullPath = path.join(process.cwd(), 'uploads', sanitizedPath);

    try {
      await fs.access(fullPath);
    } catch (e) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    let mimeType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.pdf') mimeType = 'application/pdf';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${path.basename(fullPath)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('File serve error:', error);
    return new NextResponse('Internal server error: ' + error.message, { status: 500 });
  }
}
