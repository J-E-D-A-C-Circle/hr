import { NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, nssApplications, auditLogs, verificationTokens } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getAuthPayload(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const applicationId = resolvedParams.id;
    const appIdNum = parseInt(applicationId, 10);

    if (isNaN(appIdNum)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    // 1. Fetch application details
    const appRecords = await db
      .select({
        id: nssApplications.id,
        userId: nssApplications.userId,
        firstName: nssApplications.firstName,
        lastName: nssApplications.lastName,
        email: nssApplications.email,
        phoneNumber: nssApplications.phoneNumber,
        nssNumber: nssApplications.nssNumber,
        passportPhoto: nssApplications.passportPhoto,
        idCardCopy: nssApplications.idCardCopy,
        appointmentLetter: nssApplications.appointmentLetter,
        certificates: nssApplications.certificates,
      })
      .from(nssApplications)
      .where(eq(nssApplications.id, appIdNum));

    if (appRecords.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const app = appRecords[0];
    const applicantUserId = app.userId;
    const uploadsDir = path.join(process.cwd(), 'uploads');

    // 2. Delete all uploaded files for this applicant
    // A: Remove specific files stored in columns
    const fileFields = [
      app.passportPhoto,
      app.idCardCopy,
      app.appointmentLetter,
      app.certificates,
    ];

    for (const relPath of fileFields) {
      if (relPath && typeof relPath === 'string') {
        try {
          const cleanParam = relPath.replace(/^[/\\]+/, '');
          const fullPath = path.resolve(uploadsDir, cleanParam);
          if (fullPath.startsWith(uploadsDir)) {
            await fs.unlink(fullPath).catch(() => {});
          }
        } catch {
          // Ignore individual file error
        }
      }
    }

    // B: Remove user-specific subdirectories across all upload categories (passport, id_card, appointment, cv, etc.)
    try {
      const uploadCategories = await fs.readdir(uploadsDir, { withFileTypes: true });
      for (const cat of uploadCategories) {
        if (cat.isDirectory()) {
          const catPath = path.join(uploadsDir, cat.name);
          const userFolders = await fs.readdir(catPath, { withFileTypes: true }).catch(() => []);
          for (const userFolder of userFolders) {
            if (
              userFolder.isDirectory() &&
              (userFolder.name === String(applicantUserId) ||
                userFolder.name.startsWith(`${applicantUserId}-`))
            ) {
              const targetUserFolder = path.join(catPath, userFolder.name);
              await fs.rm(targetUserFolder, { recursive: true, force: true }).catch(() => {});
            }
          }
        }
      }
    } catch (fsErr) {
      console.warn('Error cleaning up upload directories:', fsErr);
    }

    // 3. Delete from database
    // Delete application
    await db.delete(nssApplications).where(eq(nssApplications.id, appIdNum));

    // Delete applicant user account if role is applicant
    if (applicantUserId) {
      await db
        .delete(users)
        .where(and(eq(users.id, applicantUserId), eq(users.role, 'applicant')))
        .catch(() => {});
    }

    // Delete verification tokens for this phone if any
    if (app.phoneNumber) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.phoneNumber, app.phoneNumber))
        .catch(() => {});
    }

    // 4. Record Audit Log
    try {
      const applicantFullName = `${app.firstName} ${app.lastName}`;
      await db.insert(auditLogs).values({
        userId: payload.user_id,
        userName: payload.email || 'Admin',
        action: 'Applicant Deleted',
        entityType: 'application',
        entityId: appIdNum,
        details: `Deleted applicant ${applicantFullName} (${app.email}, NSS: ${app.nssNumber || 'N/A'}) and all uploaded files.`,
      });
    } catch {
      // Ignore audit fail
    }

    return NextResponse.json({
      success: true,
      message: 'Applicant and associated files deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete application error:', error);
    return NextResponse.json(
      { error: 'Failed to delete application: ' + error.message },
      { status: 500 }
    );
  }
}
