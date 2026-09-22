import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHrLettersSession } from "@/lib/hrletters-auth";

export async function GET() {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const letters = await prisma.hrLetterDocument.findMany({
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
        status: body.status || "DRAFT",
        qrCodeData: `https://dvla.gov.gh/verify?code=${verificationCode}`,
      },
      include: { staff: true },
    });

    // Create approval workflow if submitted
    if (body.status === "PENDING_APPROVAL") {
      await prisma.hrApprovalWorkflow.create({
        data: {
          letterId: letter.id,
          stepNumber: 1,
          approverRole: "HR Director",
          approverName: "Director HR",
          status: "PENDING",
        },
      });
    }

    // Audit log
    await prisma.hrLetterAuditLog.create({
      data: {
        action: "LETTER_GENERATED",
        actorName: session.fullName,
        actorRole: session.role,
        targetId: letter.id,
        targetType: "HrLetterDocument",
        details: `Generated ${letter.letterType} letter (${verificationCode}) for ${letter.staff.fullName}`,
      },
    });

    return NextResponse.json({ success: true, data: letter });
  } catch (error: any) {
    console.error("HR Letters POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
