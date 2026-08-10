import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('file');

    if (!fileUrl) {
      return new NextResponse('File parameter missing', { status: 400 });
    }

    // Clean relative file path
    const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    const filePath = path.join(process.cwd(), 'public', relativePath);

    if (!fs.existsSync(filePath)) {
      return new NextResponse(
        `<html>
          <body style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; color: #374151;">
            <h2 style="color: #dc2626;">Document Not Found</h2>
            <p>The requested file <code>${fileUrl}</code> was not found on server storage.</p>
          </body>
        </html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // If it's a Word DOCX or DOC file, parse text & tables using mammoth into styled HTML document
    if (ext === '.docx' || ext === '.doc') {
      let extractedHtml = '';
      try {
        const result = await mammoth.convertToHtml({ buffer: fileBuffer });
        extractedHtml = result.value;
      } catch (e) {
        extractedHtml = `<p><em>Could not parse binary Word formatting automatically. Please use the download link to view in Microsoft Word.</em></p>`;
      }

      const fullPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document Content Preview</title>
  <style>
    body {
      font-family: 'Public Sans', system-ui, -apple-system, sans-serif;
      background-color: #FDF6E3;
      color: #1F2937;
      margin: 0;
      padding: 30px 20px;
      line-height: 1.6;
    }
    .document-card {
      max-w-3xl: 800px;
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      padding: 40px;
    }
    .doc-header {
      border-bottom: 2px solid #15803D;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .doc-badge {
      background-color: #F0FDF4;
      color: #15803D;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid #BBF7D0;
      text-transform: uppercase;
    }
    h1, h2, h3, h4 {
      color: #111827;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    p {
      margin-bottom: 1.2em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
    }
    th, td {
      border: 1px solid #E5E7EB;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #F9FAFB;
    }
    ul, ol {
      padding-left: 24px;
      margin-bottom: 1.2em;
    }
  </style>
</head>
<body>
  <div class="document-card">
    <div class="doc-header">
      <div>
        <div style="font-size: 11px; font-weight: 800; color: #D97706; text-transform: uppercase;">DVLA Recruitment Portal</div>
        <div style="font-size: 16px; font-weight: 800; color: #111827; margin-top: 2px;">${path.basename(filePath)}</div>
      </div>
      <span class="doc-badge">MS Word (.DOCX) Extracted Content</span>
    </div>

    <div className="doc-content">
      ${extractedHtml || '<p style="color: #6B7280; font-style: italic;">Document contains no extractable text.</p>'}
    </div>
  </div>
</body>
</html>`;

      return new NextResponse(fullPageHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': 'inline',
        },
      });
    }

    // Default handling for PDF & images
    let contentType = 'application/pdf';
    if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new NextResponse('Internal server error viewing document', { status: 500 });
  }
}
