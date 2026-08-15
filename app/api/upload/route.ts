import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { query } from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileType = formData.get('file_type') as string | null;

    if (!file || !fileType) {
      return NextResponse.json(
        { error: 'File and file_type are required' },
        { status: 400 }
      );
    }

    const allowedTypes = ['passport', 'appointment', 'cv', 'id_card'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file_type. Must be passport, appointment, cv, or id_card' },
        { status: 400 }
      );
    }

    // Limit size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Get user details for folder naming
    const users = await query<any[]>(
      'SELECT full_name FROM users WHERE id = ?',
      [payload.user_id]
    );
    const userName = users.length > 0 ? users[0].full_name : 'user';
    const sanitizedName = String(userName)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'user';

    const userFolderName = `${payload.user_id}-${sanitizedName}`;

    // Base upload directory in project root
    const uploadBaseDir = path.join(process.cwd(), 'uploads', fileType, userFolderName);
    await fs.mkdir(uploadBaseDir, { recursive: true });

    const originalName = file.name;
    const cleanOriginalName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const savedFilename = `${timestamp}_${cleanOriginalName}`;
    const targetFilePath = path.join(uploadBaseDir, savedFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetFilePath, buffer);

    const relativePath = `${fileType}/${userFolderName}/${savedFilename}`;

    return NextResponse.json(
      {
        success: true,
        file_path: relativePath,
        file_name: originalName,
        file_size: file.size,
        mime_type: file.type,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to save file: ' + error.message },
      { status: 500 }
    );
  }
}
