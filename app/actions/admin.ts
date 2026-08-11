'use server';

import { prisma } from '@/lib/prisma';
import { comparePassword, setAdminSession, clearAdminSession, getAdminSession } from '@/lib/auth';
import { saveUploadedFile } from '@/lib/storage';
import { sendEmail, getStageChangeEmailTemplate } from '@/lib/mailer';
import { ApplicationStage, PositionType, PositionStatus, Prisma } from '@prisma/client';
import path from 'path';

// --- AUTH ACTIONS ---
export async function adminLogin(formData: FormData) {
  try {
    const email = formData.get('email')?.toString().trim().toLowerCase();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'Invalid admin credentials.' };
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Invalid admin credentials.' };
    }

    await setAdminSession(user.id);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function adminLogout() {
  await clearAdminSession();
  return { success: true };
}

// --- APPLICATION STAGE & HR MANAGEMENT ---
export async function updateApplicationStage(
  applicationId: string,
  newStage: ApplicationStage,
  notes?: string,
  postingStationId?: string,
  reportingDate?: string
) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized session. Please log in.' };
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: { include: { station: true } },
        position: true,
        appointmentLetter: true,
      },
    });

    if (!application) {
      return { success: false, error: 'Application not found.' };
    }

    // Update Stage & add history record
    const updatedApp = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // If posting station specified, update applicant station
      if (postingStationId) {
        await tx.applicant.update({
          where: { id: application.applicantId },
          data: { stationId: postingStationId },
        });
      }

      const formattedNotes = [
        notes,
        reportingDate ? `Assigned Start Date: ${reportingDate}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      const app = await tx.application.update({
        where: { id: applicationId },
        data: {
          currentStage: newStage,
          notes: formattedNotes || `Stage changed to ${newStage}`,
        },
      });

      await tx.applicationStageHistory.create({
        data: {
          applicationId,
          fromStage: application.currentStage,
          toStage: newStage,
          changedByUserId: currentUser.id,
          notes: formattedNotes || `Stage updated to ${newStage}`,
        },
      });

      return app;
    });

    // Prepare attachments if approved and appointment letter exists
    let attachments: Array<{ filename: string; path: string }> = [];
    if (newStage === 'APPROVED' && application.appointmentLetter) {
      const fullPath = path.join(process.cwd(), 'public', application.appointmentLetter.fileUrl);
      attachments.push({
        filename: application.appointmentLetter.fileName || 'DVLA_Official_Appointment_Letter.pdf',
        path: fullPath,
      });
    }

    // Trigger stage change email automatically
    const emailHtml = getStageChangeEmailTemplate({
      applicantName: application.applicant.fullName,
      referenceNumber: application.referenceNumber,
      positionTitle: application.position.title,
      newStage,
      notes: notes || (reportingDate ? `Your official reporting date is ${reportingDate}.` : undefined),
    });

    await sendEmail({
      to: application.applicant.email,
      subject: `Stage Update: ${newStage.replace('_', ' ')} — ${application.referenceNumber}`,
      html: emailHtml,
      attachments,
    });

    return { success: true, application: updatedApp };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function uploadAppointmentLetter(applicationId: string, formData: FormData) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized.' };
    }

    const file = formData.get('appointmentLetter') as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: 'Please select a valid PDF file.' };
    }

    const uploaded = await saveUploadedFile(file, 'appointment_letters');

    // Generate random verification code if not exists
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const verCode = `DVLA-VER-${new Date().getFullYear()}-${randomHex}`;

    const appointmentLetter = await prisma.appointmentLetter.upsert({
      where: { applicationId },
      update: {
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        uploadedByUserId: currentUser.id,
      },
      create: {
        applicationId,
        verificationCode: verCode,
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        uploadedByUserId: currentUser.id,
      },
    });

    return { success: true, appointmentLetter };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function generateOrUpdateAppointmentLetter(data: {
  applicationId: string;
  appointmentType?: string;
  letterDate?: string;
  salutation?: string;
  customRefNumber?: string;
  customSubject?: string;
  customBodyText?: string;
  effectiveDate?: string;
  salaryGrade?: string;
  probationPeriod?: string;
  contractDuration?: string;
  signatoryName?: string;
  signatoryTitle?: string;
}) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized session.' };
    }

    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: { applicant: true, position: true, department: true, station: true },
    });

    if (!application) {
      return { success: false, error: 'Application record not found.' };
    }

    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const verCode = `DVLA-VER-${new Date().getFullYear()}-${randomHex}`;

    const appType = data.appointmentType || 'TEMPORARY';
    const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');
    const yearSuffix = String(new Date().getFullYear()).slice(-2);
    const refSuffix = application.referenceNumber.slice(-4);

    let typeCode = 'PLACMT';
    let defaultSub = 'TEMPORARY PLACEMENT';
    if (appType === 'CONTRACT') {
      typeCode = 'CONTR';
      defaultSub = 'OFFER OF CONTRACT APPOINTMENT';
    } else if (appType === 'PERMANENT') {
      typeCode = 'PERM';
      defaultSub = 'OFFER OF PERMANENT APPOINTMENT';
    }

    const defaultRef = `DVLA/HR/${monthStr}/${yearSuffix}/${typeCode}/${refSuffix}`;
    const formattedLetterDate = data.letterDate?.trim() || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

    const letter = await prisma.appointmentLetter.upsert({
      where: { applicationId: data.applicationId },
      update: {
        appointmentType: appType,
        letterDate: formattedLetterDate,
        salutation: data.salutation?.trim() || 'Dear Sir/Madam,',
        customRefNumber: data.customRefNumber?.trim() || defaultRef,
        customSubject: data.customSubject?.trim() || defaultSub,
        customBodyText: data.customBodyText?.trim(),
        salaryGrade: data.salaryGrade?.trim() || null,
        probationPeriod: data.probationPeriod?.trim() || null,
        contractDuration: data.contractDuration?.trim() || null,
        signatoryName: data.signatoryName?.trim() || 'EPHRAIM NII TAN SACKEY',
        signatoryTitle: data.signatoryTitle?.trim() || 'AG. DIRECTOR HR',
        effectiveDate: data.effectiveDate?.trim() || 'Monday, August 3, 2026',
        uploadedByUserId: currentUser.id,
      },
      create: {
        applicationId: data.applicationId,
        verificationCode: verCode,
        fileUrl: `/verify/${verCode}`,
        fileName: `DVLA_Appointment_Letter_${application.referenceNumber}.pdf`,
        appointmentType: appType,
        letterDate: formattedLetterDate,
        salutation: data.salutation?.trim() || 'Dear Sir/Madam,',
        customRefNumber: data.customRefNumber?.trim() || defaultRef,
        customSubject: data.customSubject?.trim() || defaultSub,
        customBodyText: data.customBodyText?.trim(),
        salaryGrade: data.salaryGrade?.trim() || null,
        probationPeriod: data.probationPeriod?.trim() || null,
        contractDuration: data.contractDuration?.trim() || null,
        signatoryName: data.signatoryName?.trim() || 'EPHRAIM NII TAN SACKEY',
        signatoryTitle: data.signatoryTitle?.trim() || 'AG. DIRECTOR HR',
        effectiveDate: data.effectiveDate?.trim() || 'Monday, August 3, 2026',
        uploadedByUserId: currentUser.id,
      },
    });

    return { success: true, appointmentLetter: letter };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// --- DEPARTMENT MANAGEMENT ---
export async function createDepartment(name: string, code: string, description?: string) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser || currentUser.role === 'DEPT_ADMIN') {
      return { success: false, error: 'Unauthorized. Super Admin or HR required.' };
    }

    const dept = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim(),
      },
    });

    return { success: true, department: dept };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateDepartment(id: string, name: string, code: string, description?: string) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser || currentUser.role === 'DEPT_ADMIN') {
      return { success: false, error: 'Unauthorized.' };
    }

    const dept = await prisma.department.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim(),
      },
    });

    return { success: true, department: dept };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteDepartment(id: string) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admin can delete departments.' };
    }

    await prisma.department.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// --- RUBRIC BUILDER SYSTEM ---
export interface CriteriaInput {
  title: string;
  description?: string;
  maxMark: number;
  subcriteria: Array<{
    title: string;
    description?: string;
    maxMark: number;
  }>;
}

export async function savePositionRubric(positionId: string, criteriaList: CriteriaInput[]) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized.' };
    }

    // 1. Validation: total criteria maxMarks must sum to exactly 100
    const totalCriteriaMark = criteriaList.reduce((sum, c) => sum + (Number(c.maxMark) || 0), 0);
    if (Math.abs(totalCriteriaMark - 100) > 0.01) {
      return {
        success: false,
        error: `Validation Failed: Total criteria max marks must sum to exactly 100 per position (current total: ${totalCriteriaMark}).`,
      };
    }

    // 2. Validation: sub-criteria under each criteria must sum to parent criteria's max mark
    for (let i = 0; i < criteriaList.length; i++) {
      const parent = criteriaList[i];
      const parentMax = Number(parent.maxMark) || 0;
      const subTotal = parent.subcriteria.reduce((sum, sub) => sum + (Number(sub.maxMark) || 0), 0);

      if (Math.abs(subTotal - parentMax) > 0.01) {
        return {
          success: false,
          error: `Validation Failed: Sub-criteria marks under "${parent.title}" must sum to exactly ${parentMax} (current sub-criteria sum: ${subTotal}).`,
        };
      }
    }

    // Save rubric in database transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Clear existing rubric for position
      await tx.rubricCriteria.deleteMany({ where: { positionId } });

      // Insert new criteria & subcriteria
      for (let i = 0; i < criteriaList.length; i++) {
        const c = criteriaList[i];
        await tx.rubricCriteria.create({
          data: {
            positionId,
            title: c.title.trim(),
            description: c.description?.trim(),
            maxMark: Number(c.maxMark),
            order: i + 1,
            subcriteria: {
              create: c.subcriteria.map((sub, subIdx) => ({
                title: sub.title.trim(),
                description: sub.description?.trim(),
                maxMark: Number(sub.maxMark),
                order: subIdx + 1,
              })),
            },
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// --- POSITION CRUD ACTIONS ---
export async function createPosition(data: {
  title: string;
  type: PositionType;
  departmentId: string;
  description: string;
  requirements?: string;
}) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) return { success: false, error: 'Unauthorized.' };

    const position = await prisma.position.create({
      data: {
        title: data.title.trim(),
        type: data.type,
        departmentId: data.departmentId,
        description: data.description.trim(),
        requirements: data.requirements?.trim(),
        status: PositionStatus.OPEN,
        maxMarks: 100,
      },
    });

    return { success: true, position };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updatePosition(
  id: string,
  data: {
    title: string;
    type: PositionType;
    departmentId: string;
    description: string;
    requirements?: string;
    status: PositionStatus;
  }
) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) return { success: false, error: 'Unauthorized.' };

    const position = await prisma.position.update({
      where: { id },
      data: {
        title: data.title.trim(),
        type: data.type,
        departmentId: data.departmentId,
        description: data.description.trim(),
        requirements: data.requirements?.trim(),
        status: data.status,
      },
    });

    return { success: true, position };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deletePosition(id: string) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admin can delete positions.' };
    }

    await prisma.position.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// --- STATION CMS ACTIONS ---
export async function createStation(name: string, code: string, location?: string) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser || currentUser.role === 'DEPT_ADMIN') {
      return { success: false, error: 'Unauthorized.' };
    }

    const station = await prisma.station.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        location: location?.trim(),
      },
    });

    return { success: true, station };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateStation(id: string, name: string, code: string, location?: string) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser || currentUser.role === 'DEPT_ADMIN') {
      return { success: false, error: 'Unauthorized.' };
    }

    const station = await prisma.station.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        location: location?.trim(),
      },
    });

    return { success: true, station };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteStation(id: string) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admin can delete stations.' };
    }

    await prisma.station.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// --- REQUIRED DOCUMENT CHECKLIST CMS ACTIONS ---
export async function createRequiredDocument(title: string, description?: string, isMandatory: boolean = true) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser) return { success: false, error: 'Unauthorized.' };

    const doc = await prisma.requiredDocument.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        isMandatory,
      },
    });

    return { success: true, requiredDocument: doc };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteRequiredDocument(id: string) {
  try {
    const currentUser = await getAdminSession();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admin can delete required document checklist items.' };
    }

    await prisma.requiredDocument.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
