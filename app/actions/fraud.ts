'use server';

import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

/**
 * Runs automated document authenticity & duplicate detection for an application
 */
export async function runAuthenticityCheck(applicationId: string) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        documents: true,
      },
    });

    if (!application) return { success: false, error: 'Application not found.' };

    const applicant = application.applicant;
    const flags: Array<{
      alertType: string;
      severity: string;
      reason: string;
      matchedAppId?: string;
      matchedDetails?: string;
    }> = [];

    // 1. Check duplicate National ID (Ghana Card) across different email accounts
    if (applicant.nationalIdNumber && applicant.nationalIdNumber.trim()) {
      const cleanNationalId = applicant.nationalIdNumber.trim().toUpperCase();

      const matchingApplicants = await prisma.applicant.findMany({
        where: {
          nationalIdNumber: cleanNationalId,
          id: { not: applicant.id },
        },
        include: { application: true },
      });

      if (matchingApplicants.length > 0) {
        const matched = matchingApplicants[0];
        flags.push({
          alertType: 'DUPLICATE_NATIONAL_ID',
          severity: 'CRITICAL',
          reason: `Identical National ID / Ghana Card number (${cleanNationalId}) submitted under a different applicant email (${matched.email}).`,
          matchedAppId: matched.application?.id,
          matchedDetails: `Matched Applicant: ${matched.fullName} (${matched.email}, Phone: ${matched.phone})`,
        });
      }
    }

    // 2. Check duplicate Phone Number across different email accounts
    if (applicant.phone && applicant.phone.trim()) {
      const cleanPhone = applicant.phone.trim().replace(/\s+/g, '');

      const matchingPhones = await prisma.applicant.findMany({
        where: {
          phone: { contains: cleanPhone },
          id: { not: applicant.id },
        },
        include: { application: true },
      });

      if (matchingPhones.length > 0) {
        const matched = matchingPhones[0];
        flags.push({
          alertType: 'SUSPICIOUS_CONTACT',
          severity: 'MEDIUM',
          reason: `Same contact phone number (${applicant.phone}) registered to multiple email accounts (${matched.email}).`,
          matchedAppId: matched.application?.id,
          matchedDetails: `Matched Applicant: ${matched.fullName} (${matched.email})`,
        });
      }
    }

    // 3. Check duplicate CV / Document file hash across different applicants
    for (const doc of application.documents) {
      if (doc.fileHash && doc.fileHash.trim()) {
        const matchingDocs = await prisma.document.findMany({
          where: {
            fileHash: doc.fileHash,
            applicationId: { not: applicationId },
          },
          include: {
            application: { include: { applicant: true } },
          },
        });

        if (matchingDocs.length > 0) {
          const matchedDoc = matchingDocs[0];
          flags.push({
            alertType: 'DUPLICATE_CV_HASH',
            severity: 'HIGH',
            reason: `Identical CV document fingerprint/hash (${doc.fileName}) uploaded across multiple applicant submissions.`,
            matchedAppId: matchedDoc.applicationId,
            matchedDetails: `Matched Applicant: ${matchedDoc.application.applicant.fullName} (${matchedDoc.application.applicant.email})`,
          });
        }
      }
    }

    // Create FraudAlert records in DB
    for (const flag of flags) {
      await prisma.fraudAlert.create({
        data: {
          applicationId,
          alertType: flag.alertType,
          severity: flag.severity,
          reason: flag.reason,
          matchedAppId: flag.matchedAppId,
          matchedDetails: flag.matchedDetails,
          status: 'PENDING',
        },
      });
    }

    return { success: true, alertsCreated: flags.length };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetches all fraud alerts for Admin Fraud Center
 */
export async function getFraudAlerts() {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) return { success: false, error: 'Unauthorized.' };

    const alerts = await prisma.fraudAlert.findMany({
      include: {
        application: {
          include: {
            applicant: true,
            position: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, alerts };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Updates status of a fraud alert (e.g. DISMISSED, CONFIRMED_FRAUD)
 */
export async function resolveFraudAlert(alertId: string, status: 'DISMISSED' | 'CONFIRMED_FRAUD' | 'INVESTIGATING') {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) return { success: false, error: 'Unauthorized.' };

    const alert = await prisma.fraudAlert.update({
      where: { id: alertId },
      data: { status },
      include: { application: true },
    });

    // If confirmed fraud, flag application stage or add note
    if (status === 'CONFIRMED_FRAUD') {
      await prisma.application.update({
        where: { id: alert.applicationId },
        data: {
          currentStage: 'REJECTED',
          notes: `APPLICATION REJECTED & BLOCKED BY FRAUD DETECTION: ${alert.reason}`,
        },
      });
    }

    return { success: true, alert };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
