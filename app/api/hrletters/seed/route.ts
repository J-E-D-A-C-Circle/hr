import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_TEMPLATES = [
  {
    title: "Offer of Appointment",
    type: "APPOINTMENT",
    description: "Standard DVLA appointment letter for new hires",
    content: `I am pleased to convey to you that the Driver and Vehicle Licensing Authority (DVLA) has offered you appointment as {{job_title}} in the {{department}} Department at Head Office, Accra.

Your appointment is subject to a probation period of six (6) months, during which your performance and conduct will be evaluated for confirmation. Your salary and benefits will be attached to {{salary_grade}} of the Authority's Approved Salary Structure.

Your assumption of duty takes effect from {{start_date}}.

You are required to report to the Ag. Director Human Resource on {{start_date}} for formal onboarding and IPPD payroll documentation.

Kindly sign and acknowledge receipt of this document.`,
  },
  {
    title: "Letter of Promotion",
    type: "PROMOTION",
    description: "Staff promotion notification letter",
    content: `I am pleased to inform you that the Board of the Driver and Vehicle Licensing Authority (DVLA) has approved your promotion to the position of {{job_title}} in the {{department}} Department, effective {{start_date}}.

Your new appointment is on {{salary_grade}} of the Authority's Approved Salary Structure.

The Management of the Authority congratulates you on this achievement and expects that you will justify the confidence reposed in you by your dedication to duty and the high standards of performance the Authority demands.

Kindly acknowledge receipt of this letter.`,
  },
  {
    title: "Confirmation of Appointment",
    type: "CONFIRMATION",
    description: "Letter confirming staff appointment after probation",
    content: `I am pleased to inform you that following a satisfactory review of your performance during the probationary period, the Management of the Driver and Vehicle Licensing Authority (DVLA) has confirmed your appointment as {{job_title}} in the {{department}} Department, effective {{start_date}}.

Your appointment is now on the permanent establishment of the Authority on {{salary_grade}} of the Approved Salary Structure.

The Authority congratulates you and hopes you will continue to demonstrate commitment and excellence in your role.`,
  },
  {
    title: "Inter-Departmental Transfer",
    type: "TRANSFER",
    description: "Staff transfer notification between departments",
    content: `I am directed to inform you that the Management of the Driver and Vehicle Licensing Authority (DVLA) has approved your transfer from your current posting to the {{department}} Department, effective {{start_date}}.

Your role at the new posting is {{job_title}}. You are requested to report to the Head of {{department}} for formal handover arrangements prior to assumption of duties.

Kindly acknowledge receipt of this letter.`,
  },
  {
    title: "Leave Approval",
    type: "LEAVE_APPROVAL",
    description: "Official leave approval notification letter",
    content: `I am directed to inform you that your application for leave has been approved by the Management of the Driver and Vehicle Licensing Authority (DVLA).

You are hereby granted the approved leave commencing {{start_date}}. You are required to resume duty on the date stipulated in your approved leave schedule.

The Authority expects you to report back promptly on your resumption date. Failure to do so without valid reason may attract disciplinary action.

Kindly acknowledge receipt of this letter.`,
  },
  {
    title: "Contract Renewal",
    type: "CONTRACT_RENEWAL",
    description: "Contract renewal offer for existing staff",
    content: `I am pleased to inform you that the Management of the Driver and Vehicle Licensing Authority (DVLA) has reviewed your performance and hereby offers you a renewal of your contract as {{job_title}} in the {{department}} Department, effective {{start_date}}.

The terms and conditions of your renewed contract remain as previously stipulated unless otherwise amended in writing. Your remuneration continues on {{salary_grade}} of the Authority's Approved Salary Structure.

Kindly sign and return the duplicate of this letter to indicate your acceptance of the renewal.`,
  },
];

const DEFAULT_USERS = [
  {
    username: "hr.officer",
    email: "hr.officer@dvla.gov.gh",
    fullName: "HR Officer",
    passwordHash: "plain:HRoff@DVLA2026",
    role: "HR_OFFICER",
  },
  {
    username: "hr.director",
    email: "hr.director@dvla.gov.gh",
    fullName: "HR Director",
    passwordHash: "plain:HRdir@DVLA2026",
    role: "HR_DIRECTOR",
  },
];

export async function POST() {
  try {
    // Seed default templates
    let templatesCreated = 0;
    for (const tmpl of DEFAULT_TEMPLATES) {
      const existing = await prisma.hrLetterTemplate.findFirst({
        where: { type: tmpl.type, title: tmpl.title },
      });
      if (!existing) {
        await prisma.hrLetterTemplate.create({ data: tmpl });
        templatesCreated++;
      }
    }

    // Seed default users (upsert by username)
    let usersCreated = 0;
    let usersUpdated = 0;
    for (const u of DEFAULT_USERS) {
      const existing = await prisma.hrLetterUser.findFirst({
        where: { OR: [{ username: u.username }, { email: u.email }] },
      });
      if (!existing) {
        await prisma.hrLetterUser.create({ data: u });
        usersCreated++;
      } else {
        // Ensure role is correct on existing users
        await prisma.hrLetterUser.update({
          where: { id: existing.id },
          data: { role: u.role, active: true },
        });
        usersUpdated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${templatesCreated} template(s). Users created: ${usersCreated}, updated: ${usersUpdated}.`,
      credentials: DEFAULT_USERS.map((u) => ({
        role: u.role,
        username: u.username,
        email: u.email,
        password: u.passwordHash.replace("plain:", ""),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
