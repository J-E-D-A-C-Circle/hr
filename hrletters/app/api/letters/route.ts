import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const letters = await prisma.letterDocument.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        staff: true,
        approvalWorkflows: true,
      },
    });
    return NextResponse.json({ success: true, data: letters });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const verificationCode = `V-DVLA-${Math.floor(100000 + Math.random() * 900000)}`;

    let targetStaffId = body.staffId;

    // If recipient details are manually supplied without an existing staffId:
    if (!targetStaffId && (body.recipientName || body.fullName)) {
      const name = body.recipientName || body.fullName || "Target Employee";
      const sId = body.recipientStaffId || body.staffCode || `DVLA-${Math.floor(1000 + Math.random() * 9000)}`;
      const dept = body.recipientDepartment || body.department || "Operations";
      const title = body.recipientJobTitle || body.jobTitle || "Officer";

      // Upsert staff record based on staffId
      const staffRecord = await prisma.staff.upsert({
        where: { staffId: sId },
        update: {
          fullName: name,
          department: dept,
          jobTitle: title,
        },
        create: {
          staffId: sId,
          fullName: name,
          department: dept,
          jobTitle: title,
          email: `${sId.toLowerCase().replace(/[^a-z0-9]/g, "")}@dvla.gov.gh`,
          phone: "+233 24 000 0000",
          appointmentDate: new Date().toLocaleDateString("en-GB"),
        },
      });
      targetStaffId = staffRecord.id;
    }

    // Fallback if still missing
    if (!targetStaffId) {
      const firstStaff = await prisma.staff.findFirst();
      if (firstStaff) {
        targetStaffId = firstStaff.id;
      } else {
        const newStaff = await prisma.staff.create({
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
        targetStaffId = newStaff.id;
      }
    }

    const letter = await prisma.letterDocument.create({
      data: {
        staffId: targetStaffId,
        templateId: body.templateId || null,
        verificationCode,
        title: body.title,
        letterType: body.letterType,
        content: body.content,
        salutation: body.salutation || "Dear Sir/Madam,",
        customRefNumber: body.customRefNumber || `DVLA/HR/${body.letterType.substring(0, 3)}/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
        effectiveDate: body.effectiveDate || new Date().toISOString().split("T")[0],
        salaryGrade: body.salaryGrade || "Grade 12 Step 1",
        probationPeriod: body.probationPeriod || "6 Months",
        status: body.status || "DRAFT",
        signatoryName: body.signatoryName || "EPHRAIM NII TAN SACKEY",
        signatoryTitle: body.signatoryTitle || "AG. DIRECTOR, HUMAN RESOURCE",
        qrCodeData: `https://dvla.gov.gh/verify?code=${verificationCode}`,
      },
      include: {
        staff: true,
      },
    });

    if (body.status === "PENDING_APPROVAL") {
      await prisma.approvalWorkflow.create({
        data: {
          letterId: letter.id,
          stepNumber: 1,
          approverRole: "HR Manager",
          approverName: "Abena Osei",
          status: "PENDING",
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "LETTER_GENERATED",
        actorName: body.actorName || "HR Officer",
        actorRole: body.actorRole || "HR Officer",
        targetId: letter.id,
        targetType: "LetterDocument",
        details: `Generated ${letter.letterType} letter (${verificationCode}) for ${letter.staff.fullName}`,
      },
    });

    return NextResponse.json({ success: true, data: letter });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
