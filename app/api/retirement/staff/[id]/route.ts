import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRetirement, validateDateOfBirth } from "@/lib/retirement";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staffIdNum = parseInt(id, 10);

    const staff = await prisma.retirementStaff.findUnique({
      where: { id: staffIdNum },
      include: {
        department: true,
        alerts: {
          orderBy: { triggeredAt: "desc" },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    const calc = calculateRetirement(staff.dateOfBirth, staff.dateOfFirstAppointment);

    // Fetch audit history for this staff member
    const auditLogs = await prisma.retirementAuditLog.findMany({
      where: { staffId: staff.id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      staff: {
        ...staff,
        currentAge: calc.currentAge,
        currentAgeFormatted: calc.currentAgeFormatted,
        retirementDateFormatted: calc.retirementDateFormatted,
        yearsRemaining: calc.yearsRemaining,
        monthsRemaining: calc.monthsRemaining,
        daysRemaining: calc.daysRemaining,
        timeRemainingFormatted: calc.timeRemainingFormatted,
        computedStatus: calc.status,
        statusLabel: calc.statusLabel,
        badgeVariant: calc.badgeVariant,
        percentageCompleted: calc.percentageCompleted,
      },
      alerts: staff.alerts,
      auditLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch staff profile." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staffIdNum = parseInt(id, 10);
    const body = await request.json();
    const {
      fullName,
      dateOfBirth,
      gender,
      departmentId,
      jobTitle,
      grade,
      dateOfFirstAppointment,
      email,
      phone,
    } = body;

    const existing = await prisma.retirementStaff.findUnique({ where: { id: staffIdNum } });
    if (!existing) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    if (dateOfBirth) {
      const v = validateDateOfBirth(dateOfBirth);
      if (!v.valid) {
        return NextResponse.json({ error: v.message }, { status: 400 });
      }
    }

    const dobDate = dateOfBirth ? new Date(dateOfBirth) : existing.dateOfBirth;
    const dofaDate = dateOfFirstAppointment ? new Date(dateOfFirstAppointment) : existing.dateOfFirstAppointment;
    const calc = calculateRetirement(dobDate, dofaDate);

    let deptName = existing.departmentName;
    let deptIdNum = existing.departmentId;
    if (departmentId !== undefined) {
      if (departmentId === null || departmentId === "") {
        deptIdNum = null;
        deptName = null;
      } else {
        deptIdNum = parseInt(departmentId, 10);
        const deptObj = await prisma.retirementDepartment.findUnique({ where: { id: deptIdNum } });
        if (deptObj) deptName = deptObj.name;
      }
    }

    const updated = await prisma.retirementStaff.update({
      where: { id: staffIdNum },
      data: {
        fullName: fullName ? fullName.trim() : existing.fullName,
        dateOfBirth: dobDate,
        gender: gender || existing.gender,
        departmentId: deptIdNum,
        departmentName: deptName,
        jobTitle: jobTitle ? jobTitle.trim() : existing.jobTitle,
        grade: grade !== undefined ? grade : existing.grade,
        dateOfFirstAppointment: dofaDate,
        retirementDate: calc.retirementDate,
        actualRetirementDate: calc.status === "RETIRED" ? calc.retirementDate : null,
        retirementStatus: calc.status,
        email: email !== undefined ? email : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
      },
      include: { department: true },
    });

    await prisma.retirementAuditLog.create({
      data: {
        userName: "HR Officer",
        userRole: "HR User",
        action: "UPDATE_STAFF",
        details: `Updated staff profile for '${updated.fullName}' (${updated.staffId}). Recalculated statutory retirement date: ${calc.retirementDateFormatted}`,
        staffId: updated.id,
      },
    });

    return NextResponse.json({ success: true, staff: updated, calculation: calc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update staff record." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staffIdNum = parseInt(id, 10);

    const staff = await prisma.retirementStaff.findUnique({ where: { id: staffIdNum } });
    if (!staff) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    await prisma.retirementStaff.update({
      where: { id: staffIdNum },
      data: { active: false },
    });

    await prisma.retirementAuditLog.create({
      data: {
        userName: "HR Officer",
        userRole: "HR User",
        action: "DEACTIVATE_STAFF",
        details: `Deactivated staff record '${staff.fullName}' (${staff.staffId}).`,
        staffId: staff.id,
      },
    });

    return NextResponse.json({ success: true, message: `Staff record ${staff.staffId} deactivated successfully.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to deactivate staff record." }, { status: 500 });
  }
}
