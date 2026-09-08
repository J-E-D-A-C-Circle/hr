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

    // 4. Ensure Constance Akua Essuman staff & approved promotion letter exist
    let constanceStaff = await prisma.staff.findFirst({
      where: { email: "constanceakua.essuman@dvla.gov.gh" },
    });

    if (!constanceStaff) {
      constanceStaff = await prisma.staff.create({
        data: {
          staffId: "DVLA-883012",
          fullName: "Constance Akua Essuman",
          department: "Driver Licensing & Executive Administration",
          jobTitle: "Senior Licensing & HR Director",
          email: "constanceakua.essuman@dvla.gov.gh",
          phone: "+233 24 555 7788",
          appointmentDate: "2022-01-15",
          status: "ACTIVE",
          salaryGrade: "Grade 16 Step 5",
          reportingOfficer: "Director-General DVLA",
        },
      });
    }

    const promotionLetter = await prisma.letterDocument.findFirst({
      where: { staffId: constanceStaff.id, letterType: "PROMOTION" },
    });

    if (!promotionLetter) {
      const promoCode = "V-DVLA-883012";
      const promoTemplate = await prisma.letterTemplate.findFirst({ where: { type: "PROMOTION" } });
      const templateContent = promoTemplate?.content || `Dear {{staff_name}},\n\nRE: PROMOTION TO {{job_title}}\n\nManagement is pleased to inform you that following your outstanding performance appraisals, you have been promoted to the position of {{job_title}} in the {{department}} Department.\n\nEffective Date: {{start_date}}\nSalary Grade: {{salary_grade}}\nReporting Officer: {{reporting_officer}}`;

      const content = templateContent
        .replace("{{staff_name}}", "Constance Akua Essuman")
        .replace("{{job_title}}", "Senior Licensing & Executive HR Director")
        .replace("{{department}}", "Driver Licensing & Executive Administration")
        .replace("{{start_date}}", "01/09/2026")
        .replace("{{salary_grade}}", "DVLA Executive Grade 16 Step 5")
        .replace("{{reporting_officer}}", "Director-General DVLA");

      const createdPromo = await prisma.letterDocument.create({
        data: {
          staffId: constanceStaff.id,
          templateId: promoTemplate?.id || null,
          verificationCode: promoCode,
          title: "Letter of Promotion — Constance Akua Essuman",
          letterType: "PROMOTION",
          content,
          salutation: "Dear Madam,",
          customRefNumber: "DVLA/HR/PROM/2026/088",
          effectiveDate: "01/09/2026",
          salaryGrade: "DVLA Executive Grade 16 Step 5",
          status: "APPROVED",
          signatoryName: "EPHRAIM NII TAN SACKEY",
          signatoryTitle: "AG. DIRECTOR, HUMAN RESOURCE",
        },
      });

      await prisma.approvalWorkflow.create({
        data: {
          letterId: createdPromo.id,
          stepNumber: 1,
          approverRole: "Department Head",
          approverName: "Abena Osei",
          status: "APPROVED",
          comments: "Promotional appraisal verified and recommended for HR Director issuance.",
          decidedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "LETTER_APPROVED",
          actorName: "Abena Osei",
          actorRole: "DEPT_HEAD",
          targetId: createdPromo.id,
          targetType: "LetterDocument",
          details: `Approved promotion letter ${promoCode} for Constance Akua Essuman (constanceakua.essuman@dvla.gov.gh)`,
        },
      });
    }

    return NextResponse.json({ success: true, message: "HR Letters Portal Database initialized with Constance Akua Essuman Promotion Letter" });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
