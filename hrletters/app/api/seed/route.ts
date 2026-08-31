import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { initialStaff, initialTemplates } from "@/lib/seedData";

export async function GET() {
  try {
    // 1. Seed Staff if empty
    const staffCount = await prisma.staff.count();
    if (staffCount === 0) {
      for (const s of initialStaff) {
        await prisma.staff.create({ data: s });
      }
    }

    // 2. Seed Templates if empty
    const templateCount = await prisma.letterTemplate.count();
    if (templateCount === 0) {
      for (const t of initialTemplates) {
        await prisma.letterTemplate.create({ data: t });
      }
    }

    // 3. Create initial demo appointment letter if empty
    const letterCount = await prisma.letterDocument.count();
    if (letterCount === 0) {
      const staff = await prisma.staff.findFirst();
      const template = await prisma.letterTemplate.findFirst({ where: { type: "APPOINTMENT" } });
      if (staff && template) {
        const verificationCode = `V-DVLA-${Math.floor(100000 + Math.random() * 900000)}`;
        const content = template.content
          .replace("{{staff_name}}", staff.fullName)
          .replace("{{job_title}}", staff.jobTitle)
          .replace("{{department}}", staff.department)
          .replace("{{start_date}}", staff.appointmentDate)
          .replace("{{salary_grade}}", staff.salaryGrade || "Grade 12 Step 1")
          .replace("{{reporting_officer}}", staff.reportingOfficer || "Director HR");

        const letter = await prisma.letterDocument.create({
          data: {
            staffId: staff.id,
            templateId: template.id,
            verificationCode,
            title: `Appointment Letter - ${staff.fullName}`,
            letterType: "APPOINTMENT",
            content,
            salutation: "Dear Sir/Madam,",
            customRefNumber: `DVLA/HR/APT/${new Date().getFullYear()}/001`,
            effectiveDate: staff.appointmentDate,
            salaryGrade: staff.salaryGrade || "Grade 12 Step 1",
            probationPeriod: "6 Months",
            status: "ISSUED",
            signatoryName: "EPHRAIM NII TAN SACKEY",
            signatoryTitle: "AG. DIRECTOR, HUMAN RESOURCE",
            signedAt: new Date(),
            issuedAt: new Date(),
            qrCodeData: `https://dvla.gov.gh/verify?code=${verificationCode}`,
          },
        });

        // Add Approval step
        await prisma.approvalWorkflow.create({
          data: {
            letterId: letter.id,
            stepNumber: 1,
            approverRole: "HR Manager",
            approverName: "Abena Osei",
            status: "APPROVED",
            comments: "Staff appointment verified and approved.",
            decidedAt: new Date(),
          },
        });

        await prisma.auditLog.create({
          data: {
            action: "LETTER_ISSUED",
            actorName: "Abena Osei",
            actorRole: "HR Officer",
            targetId: letter.id,
            targetType: "LetterDocument",
            details: `Appointment letter ${verificationCode} issued to ${staff.fullName}`,
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "HR Letters Portal Database initialized successfully" });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
