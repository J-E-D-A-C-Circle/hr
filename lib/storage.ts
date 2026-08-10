import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function saveUploadedFile(file: File, subfolder: string = 'documents'): Promise<{ fileUrl: string; fileName: string; fileSize: number; mimeType: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const targetFolder = path.join(UPLOAD_DIR, subfolder);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Create unique filename
  const timestamp = Date.now();
  const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}_${safeOriginalName}`;
  const filePath = path.join(targetFolder, filename);

  await fs.promises.writeFile(filePath, buffer);

  const fileUrl = `/uploads/${subfolder}/${filename}`;
  return {
    fileUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
  };
}
