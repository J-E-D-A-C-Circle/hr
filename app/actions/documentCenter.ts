'use server';

import { prisma } from '@/lib/prisma';
import { saveUploadedFile } from '@/lib/storage';

export async function getApplicantDocumentCenter(referenceNumber: string, email: string) {
  try {
    const cleanRef = referenceNumber.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const application = await prisma.application.findUnique({
      where: { referenceNumber: cleanRef },
      include: {
        applicant: true,
        position: true,
        department: true,
        submittedDocuments: {
          include: { requiredDocument: true },
        },
      },
    });

    if (!application) {
      return { success: false, error: 'Application not found with the provided reference number.' };
    }

    if (application.applicant.email.toLowerCase() !== cleanEmail) {
      return { success: false, error: 'Email address does not match application records.' };
    }

    if (application.currentStage !== 'APPROVED') {
      return {
        success: false,
        error: `Document Center is only accessible after application approval. Current status: ${application.currentStage.replace('_', ' ')}.`,
      };
    }

    // Fetch universal checklist of required documents
    const requiredDocuments = await prisma.requiredDocument.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Map required documents with applicant's submission status
    const checklist = requiredDocuments.map((reqDoc: any) => {
      const submission = application.submittedDocuments.find((s: any) => s.requiredDocumentId === reqDoc.id);
      return {
        requiredDocument: reqDoc,
        submission: submission || null,
        isSubmitted: !!submission,
      };
    });

    const totalRequired = requiredDocuments.length;
    const totalSubmitted = checklist.filter((item: any) => item.isSubmitted).length;
    const progressPercent = totalRequired > 0 ? Math.round((totalSubmitted / totalRequired) * 100) : 0;

    return {
      success: true,
      application,
      checklist,
      progress: {
        submittedCount: totalSubmitted,
        totalCount: totalRequired,
        percentage: progressPercent,
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function uploadPostAcceptanceDocument(
  applicationId: string,
  requiredDocumentId: string,
  formData: FormData
) {
  try {
    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: 'Please select a file to upload.' };
    }

    const uploaded = await saveUploadedFile(file, 'post_acceptance');

    const submission = await prisma.applicantSubmittedDocument.upsert({
      where: {
        id: formData.get('submissionId')?.toString() || 'new-id-placeholder',
      },
      update: {
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        status: 'PENDING',
        submittedAt: new Date(),
      },
      create: {
        applicationId,
        requiredDocumentId,
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        status: 'PENDING',
      },
    });

    return { success: true, submission };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
