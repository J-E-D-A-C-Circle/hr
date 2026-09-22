import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHrLettersSession } from "@/lib/hrletters-auth";

export async function GET() {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // HR_OFFICER sees only their own letters (drafts + submitted)
    // HR_DIRECTOR sees all letters
    const where = session.role === "HR_OFFICER"
      ? { createdByUsername: session.username }
      : {};

    const letters = await prisma.hrLetterDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { staff: true, approvalWorkflows: true },
    });

    return NextResponse.json({ success: true, data: letters });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only HR_OFFICER and HR_DIRECTOR can create letters
    if (!["HR_OFFICER", "HR_DIRECTOR"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 });
    }

    const body = await req.json();
    const verificationCode = `V-DVLA-${Math.floor(100000 + Math.random() * 900000)}`;

    let targetStaffId = body.staffId;

    // Auto-upsert staff if manually entered
    if (!targetStaffId && (body.recipientName || body.fullName)) {
      const name = body.recipientName || body.fullName || "Target Employee";
      const sId = body.recipientStaffId || body.staffCode || `DVLA-${Math.floor(1000 + Math.random() * 9000)}`;
      const dept = body.recipientDepartment || body.department || "Operations";
      const title = body.recipientJobTitle || body.jobTitle || "Officer";
      const email = `${sId.toLowerCase().replace(/[^a-z0-9]/g, "")}@dvla.gov.gh`;

      const staffRecord = await prisma.hrLetterStaff.upsert({
        where: { staffId: sId },
        update: { fullName: name, department: dept, jobTitle: title },
        create: {
          staffId: sId,
          fullName: name,
          department: dept,
          jobTitle: title,
          email,
          phone: "+233 24 000 0000",
          appointmentDate: new Date().toLocaleDateString("en-GB"),
        },
      });
      targetStaffId = staffRecord.id;
    }

    // Last resort fallback
    if (!targetStaffId) {
      const first = await prisma.hrLetterStaff.findFirst();
      if (first) {
        targetStaffId = first.id;
      } else {
        const created = await prisma.hrLetterStaff.create({
          data: {
            staffId: `DVLA-${Math.floor(1000 + Math.random() * 9000)}`,
            fullName: body.recipientName || "Default Employee",
            department: "General",
            jobTitle: "Officer",
            email: `default_${Date.now()}@dvla.gov.gh`,
            phone: "+233 24 000 0000",
            appointmentDate: new Date().toLocaleDateString("en-GB"),
          },
        });
        targetStaffId = created.id;
      }
    }

    // HR_OFFICER can only save DRAFT or submit as PENDING_APPROVAL
    // HR_DIRECTOR can set any status on creation
    const allowedStatus = session.role === "HR_OFFICER"
      ? ["DRAFT", "PENDING_APPROVAL"].includes(body.status) ? body.status : "DRAFT"
      : body.status || "DRAFT";

    const letter = await prisma.hrLetterDocument.create({
      data: {
        staffId: targetStaffId,
        templateId: body.templateId || null,
        verificationCode,
        title: body.title || "Official HR Letter",
        letterType: body.letterType || "APPOINTMENT",
        content: body.content,
        salutation: body.salutation || "Dear Sir/Madam,",
        customRefNumber: body.customRefNumber || `DVLA/HR/07/${new Date().getFullYear()}/PLACMT/${Math.floor(100 + Math.random() * 900)}`,
        yourRef: body.yourRef || null,
        effectiveDate: body.effectiveDate || null,
        salaryGrade: body.salaryGrade || null,
        applicantAddress: body.applicantAddress || "ACCRA - GHANA",
        signatoryName: body.signatoryName || "EPHRAIM NII TAN SACKEY",
        signatoryTitle: body.signatoryTitle || "AG. DIRECTOR, HUMAN RESOURCE",
        signatoryForTitle: body.signatoryForTitle || "FOR: CHIEF EXECUTIVE",
        ccText: body.ccText || null,
        status: allowedStatus,
        qrCodeData: `https://dvla.gov.gh/verify?code=${verificationCode}`,
      },
      include: { staff: true },
    });

    // Create approval workflow entry when submitted for approval
    if (allowedStatus === "PENDING_APPROVAL") {
      await prisma.hrApprovalWorkflow.create({
        data: {
          letterId: letter.id,
          stepNumber: 1,
          approverRole: "HR_DIRECTOR",
          approverName: "Director HR",
          status: "PENDING",
        },
      });
    }

    // Audit log
    await prisma.hrLetterAuditLog.create({
      data: {
        action: allowedStatus === "PENDING_APPROVAL" ? "LETTER_SUBMITTED" : "LETTER_DRAFTED",
        actorName: session.fullName,
        actorRole: session.role,
        targetId: letter.id,
        targetType: "HrLetterDocument",
        details: `${allowedStatus === "PENDING_APPROVAL" ? "Submitted for approval" : "Saved as draft"}: ${letter.letterType} letter (${verificationCode}) for ${letter.staff.fullName}`,
      },
    });

    return NextResponse.json({ success: true, data: letter });
  } catch (error: any) {
    console.error("HR Letters POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
