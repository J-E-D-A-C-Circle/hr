'use server';

import { prisma } from '@/lib/prisma';
import { saveUploadedFile } from '@/lib/storage';
import { sendEmail, getStageChangeEmailTemplate } from '@/lib/mailer';
import { ApplicationStage, ApplicationDocumentType, Prisma } from '@prisma/client';

export async function submitApplication(formData: FormData) {
  try {
    const fullName = formData.get('fullName')?.toString().trim();
    const email = formData.get('email')?.toString().trim().toLowerCase();
    const phone = formData.get('phone')?.toString().trim();
    const nationalIdNumber = formData.get('nationalIdNumber')?.toString().trim();
    const positionId = formData.get('positionId')?.toString();
    const isCurrentDvlaStaff = formData.get('isCurrentDvlaStaff') === 'true';
    const stationId = isCurrentDvlaStaff ? formData.get('stationId')?.toString() || null : null;
    const departmentId = formData.get('departmentId')?.toString();

    const cvFile = formData.get('cv') as File | null;
    const applicationLetterFile = formData.get('applicationLetter') as File | null;
    const certificateFile = formData.get('certificate') as File | null;

    if (!fullName || !email || !phone || !positionId || !departmentId) {
      return { success: false, error: 'Please fill in all required personal and position fields.' };
    }

    if (!cvFile || cvFile.size === 0) {
      return { success: false, error: 'Curriculum Vitae (CV) document is required.' };
    }

    if (!applicationLetterFile || applicationLetterFile.size === 0) {
      return { success: false, error: 'Official Application Letter document is required.' };
    }

    if (!certificateFile || certificateFile.size === 0) {
      return { success: false, error: 'Academic Certificate / Transcript document is required.' };
    }

    // Check unique constraint on applicant email (1 application per person)
    const existingApplicant = await prisma.applicant.findUnique({
      where: { email },
      include: { application: true },
    });

    if (existingApplicant) {
      const ref = existingApplicant.application?.referenceNumber || 'N/A';
      return {
        success: false,
        error: `An application has already been submitted under email ${email} (Reference #: ${ref}). Only one application per person is allowed.`,
      };
    }

    // Verify selected position exists
    const position = await prisma.position.findUnique({
      where: { id: positionId },
    });

    if (!position) {
      return { success: false, error: 'Selected position is not available.' };
    }

    // Save uploaded files
    const uploadedCv = await saveUploadedFile(cvFile, 'cvs');
    const uploadedApp = await saveUploadedFile(applicationLetterFile, 'letters');
    const uploadedCert = await saveUploadedFile(certificateFile, 'certificates');

    // Generate unique reference number
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referenceNumber = `DVLA-2026-${randomCode}`;

    // Transaction to create Applicant + Application + Documents + Stage History
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const applicant = await tx.applicant.create({
        data: {
          fullName,
          email,
          phone,
          nationalIdNumber: nationalIdNumber || null,
          isCurrentDvlaStaff,
          stationId: isCurrentDvlaStaff ? stationId : null,
          departmentId: isCurrentDvlaStaff ? departmentId : null,
        },
      });

      const application = await tx.application.create({
        data: {
          referenceNumber,
          applicantId: applicant.id,
          positionId,
          departmentId,
          isCurrentDvlaStaff,
          stationId: isCurrentDvlaStaff ? stationId : null,
          currentStage: ApplicationStage.SUBMITTED,
          notes: 'Application submitted via public recruitment portal.',
          documents: {
            create: [
              {
                type: ApplicationDocumentType.CV,
                fileUrl: uploadedCv.fileUrl,
                fileName: uploadedCv.fileName,
                fileSize: uploadedCv.fileSize,
                mimeType: uploadedCv.mimeType,
              },
              {
                type: ApplicationDocumentType.APPLICATION_LETTER,
                fileUrl: uploadedApp.fileUrl,
                fileName: uploadedApp.fileName,
                fileSize: uploadedApp.fileSize,
                mimeType: uploadedApp.mimeType,
              },
              {
                type: ApplicationDocumentType.CERTIFICATE,
                fileUrl: uploadedCert.fileUrl,
                fileName: uploadedCert.fileName,
                fileSize: uploadedCert.fileSize,
                mimeType: uploadedCert.mimeType,
              },
            ],
          },
          stageHistory: {
            create: [
              {
                toStage: ApplicationStage.SUBMITTED,
                notes: 'Initial application submitted.',
              },
            ],
          },
        },
      });

      return application;
    });

    // Run background authenticity check for fraud detection
    try {
      const { runAuthenticityCheck } = await import('@/app/actions/fraud');
      await runAuthenticityCheck(result.id);
    } catch (checkErr) {
      console.error('Authenticity check error:', checkErr);
    }

    // Send confirmation email
    const emailHtml = getStageChangeEmailTemplate({
      applicantName: fullName,
      referenceNumber,
      positionTitle: position.title,
      newStage: 'SUBMITTED',
    });

    await sendEmail({
      to: email,
      subject: `Application Received — ${referenceNumber} (${position.title})`,
      html: emailHtml,
    });

    return { success: true, referenceNumber };
  } catch (error) {
    console.error('Error submitting application:', error);
    return { success: false, error: (error as Error).message || 'Failed to submit application.' };
  }
}

export async function checkApplicationStatus(referenceNumber: string, email?: string) {
  try {
    const cleanRef = referenceNumber.trim().toUpperCase();
    const app = await prisma.application.findUnique({
      where: { referenceNumber: cleanRef },
      include: {
        applicant: true,
        position: true,
        department: true,
        station: true,
        stageHistory: { orderBy: { createdAt: 'desc' } },
        appointmentLetter: true,
      },
    });

    if (!app) {
      return { success: false, error: 'Application not found with the provided reference number.' };
    }

    if (email && app.applicant.email.toLowerCase() !== email.trim().toLowerCase()) {
      return { success: false, error: 'Email address does not match the application record.' };
    }

    return { success: true, application: app };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
