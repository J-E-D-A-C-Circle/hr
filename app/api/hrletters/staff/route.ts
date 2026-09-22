import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHrLettersSession } from "@/lib/hrletters-auth";

export async function GET() {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await prisma.hrLetterStaff.findMany({
      orderBy: { fullName: "asc" },
      include: { _count: { select: { letters: true } } },
    });

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
