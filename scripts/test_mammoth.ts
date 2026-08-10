import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

async function main() {
  const filePath = path.join(process.cwd(), 'public', 'uploads', 'cvs', '1786378518670_UI.docx');
  console.log(`Checking file: ${filePath}`);
  console.log(`Exists: ${fs.existsSync(filePath)}`);

  const fileBuffer = fs.readFileSync(filePath);
  console.log(`Buffer size: ${fileBuffer.length} bytes`);

  try {
    const result = await mammoth.convertToHtml({ buffer: fileBuffer });
    console.log('--- EXTRACTED HTML ---');
    console.log(result.value);
    console.log('--- WARNINGS ---');
    console.log(result.messages);
  } catch (err) {
    console.error('MAMMOTH ERROR:', err);
  }
}

main();
