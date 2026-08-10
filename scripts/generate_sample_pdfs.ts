import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createSamplePdf(filename: string, title: string, candidateName: string, role: string, dept: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Green header bar
  page.drawRectangle({
    x: 0,
    y: 720,
    width: 600,
    height: 80,
    color: rgb(0.06, 0.32, 0.20),
  });

  page.drawText('DRIVER AND VEHICLE LICENSING AUTHORITY', {
    x: 40,
    y: 760,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('OFFICIAL RECRUITMENT & ATTACHMENT DOCUMENT', {
    x: 40,
    y: 735,
    size: 11,
    font: fontBold,
    color: rgb(0.98, 0.75, 0.28),
  });

  // Body content
  let y = 660;

  page.drawText(`DOCUMENT TYPE: ${title.toUpperCase()}`, {
    x: 40,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 30;
  page.drawLine({
    start: { x: 40, y },
    end: { x: 560, y },
    thickness: 1.5,
    color: rgb(0.06, 0.32, 0.20),
  });

  y -= 40;
  page.drawText(`Candidate Full Name: ${candidateName}`, {
    x: 40,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 25;
  page.drawText(`Target Position: ${role}`, {
    x: 40,
    y,
    size: 12,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 25;
  page.drawText(`Department: ${dept}`, {
    x: 40,
    y,
    size: 12,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 25;
  page.drawText(`Document Status: VERIFIED & SECURITY CHECKED`, {
    x: 40,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.5, 0.24),
  });

  // Summary box
  y -= 50;
  page.drawRectangle({
    x: 40,
    y: y - 180,
    width: 520,
    height: 180,
    color: rgb(0.98, 0.96, 0.91),
    borderColor: rgb(0.85, 0.75, 0.5),
    borderWidth: 1,
  });

  page.drawText('APPLICANT PROFILE SUMMARY & QUALIFICATIONS:', {
    x: 60,
    y: y - 30,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText('• Completed formal tertiary degree/diploma coursework with high academic standing.', {
    x: 60,
    y: y - 60,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText('• Valid Ghana Card national identity verification record matched cleanly.', {
    x: 60,
    y: y - 85,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText('• Verified medical assessment clearance certificate attached.', {
    x: 60,
    y: y - 110,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText('• Recommended for panel scoring evaluation and HR review.', {
    x: 60,
    y: y - 135,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Footer seal
  page.drawText('DVLA GHANA — OFFICIAL DIGITAL RECRUITMENT RECORD', {
    x: 130,
    y: 40,
    size: 9,
    font: fontBold,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  const dir = path.join(process.cwd(), 'public', 'uploads', 'documents');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, pdfBytes);
  console.log(`✓ Generated valid PDF: ${filePath}`);
}

async function main() {
  await createSamplePdf('sample_cv.pdf', 'Curriculum Vitae (CV)', 'Kwame Mensah', 'Software Engineering Attachment Trainee', 'Information Technology');
  await createSamplePdf('sample_cv2.pdf', 'Curriculum Vitae (CV)', 'Abena Osei', 'Vehicle Inspection Attachment Trainee', 'Vehicle Inspection & Testing');
  await createSamplePdf('sample_cover.pdf', 'Cover Letter', 'Kwame Mensah', 'Software Engineering Attachment Trainee', 'Information Technology');
  await createSamplePdf('sample_app.pdf', 'Application Letter', 'Kwame Mensah', 'Software Engineering Attachment Trainee', 'Information Technology');
}

main().catch(console.error);
