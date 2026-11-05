import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHrLettersSession } from "@/lib/hrletters-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let staff = await prisma.hrLetterStaff.findMany({
      orderBy: { fullName: "asc" },
      include: { _count: { select: { letters: true } } },
    });

    // If no HR Letter staff records exist yet, seed from approved staff registry
    if (staff.length === 0) {
      const mainStaff = await prisma.staff.findMany({
        take: 100,
        where: { approval_status: "APPROVED" },
        orderBy: { full_name: "asc" },
      });

      for (const s of mainStaff) {
        if (!s.staff_code || !s.full_name) continue;
        try {
          await prisma.hrLetterStaff.create({
            data: {
              staffId: s.staff_code,
              fullName: s.full_name,
              department: s.department || "Operations",
              jobTitle: s.role || "Officer",
              email: s.email || `${s.staff_code.toLowerCase().replace(/[^a-z0-9]/g, "")}@dvla.gov.gh`,
              phone: s.phone || "+233 24 000 0000",
              appointmentDate: "01/01/2026",
              salaryGrade: "Grade 12 Step 1",
            },
          });
        } catch {
          // Ignore duplicate staffId
        }
      }

      staff = await prisma.hrLetterStaff.findMany({
        orderBy: { fullName: "asc" },
        include: { _count: { select: { letters: true } } },
      });
    }

    return NextResponse.json({ success: true, data: staff });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { staffId, fullName, department, jobTitle, email, phone, appointmentDate, salaryGrade, reportingOfficer } = body;

    if (!staffId || !fullName || !department || !jobTitle || !email || !phone || !appointmentDate) {
      return NextResponse.json({ success: false, error: "Required fields missing" }, { status: 400 });
    }

    const staff = await prisma.hrLetterStaff.create({
      data: { staffId, fullName, department, jobTitle, email, phone, appointmentDate, salaryGrade, reportingOfficer },
    });

    return NextResponse.json({ success: true, data: staff });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
