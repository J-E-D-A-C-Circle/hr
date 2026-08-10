'use server';

import { prisma } from '@/lib/prisma';

export async function verifyAppointmentLetterCode(code: string) {
  try {
    const cleanCode = code.trim();
    if (!cleanCode) {
      return { success: false, error: 'Verification code or reference number is required.' };
    }

    // Search by verificationCode or referenceNumber
    const appointmentLetter = await prisma.appointmentLetter.findFirst({
      where: {
        OR: [
          { verificationCode: cleanCode },
          { application: { referenceNumber: cleanCode } },
          { customRefNumber: cleanCode },
        ],
      },
      include: {
        application: {
          include: {
            applicant: true,
            position: true,
            department: true,
            station: true,
          },
        },
        uploadedByUser: true,
      },
    });

    if (!appointmentLetter) {
      return {
        success: false,
        error: 'No authentic DVLA appointment letter record found matching this verification code.',
      };
    }

    return {
      success: true,
      appointmentLetter,
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
