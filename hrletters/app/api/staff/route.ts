import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { createdAt: "desc" },
      include: { letters: true },
    });
    return NextResponse.json({ success: true, data: staff });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const staff = await prisma.staff.create({
      data: {
        staffId: body.staffId || `HR-2026-${Math.floor(100 + Math.random() * 900)}`,
        fullName: body.fullName,
        department: body.department,
        jobTitle: body.jobTitle,
        email: body.email,
        phone: body.phone,
        appointmentDate: body.appointmentDate || new Date().toISOString().split("T")[0],
        status: body.status || "ACTIVE",
        salaryGrade: body.salaryGrade || "Grade 10 Step 1",
        reportingOfficer: body.reportingOfficer || "Director HR",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "STAFF_CREATED",
        actorName: "HR System Admin",
        actorRole: "HR Officer",
        targetId: staff.id,
        targetType: "Staff",
        details: `Created new staff record for ${staff.fullName} (${staff.staffId})`,
      },
    });

    return NextResponse.json({ success: true, data: staff });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
