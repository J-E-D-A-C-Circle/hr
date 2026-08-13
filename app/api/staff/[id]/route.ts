import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateEndDate, computeContractStatus, computeDaysRemaining, parseFlexibleDate } from "@/lib/status";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staffId = parseInt(id, 10);

    if (isNaN(staffId)) {
      return NextResponse.json({ success: false, error: "Invalid staff ID" }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        contracts: {
          orderBy: {
            renewal_number: "desc",
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    const currentContract = staff.contracts.find((c: any) => c.is_current) || staff.contracts[0] || null;
    const computedStatus = computeContractStatus(currentContract);
    const daysRemaining = currentContract && !currentContract.is_terminated ? computeDaysRemaining(currentContract.end_date) : null;

    return NextResponse.json({
      success: true,
      data: {
        ...staff,
        currentContract,
        computedStatus,
        daysRemaining,
      },
    });
  } catch (error: any) {
    console.error("GET /api/staff/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch staff profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staffId = parseInt(id, 10);
    if (isNaN(staffId)) {
      return NextResponse.json({ success: false, error: "Invalid staff ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      staff_code,
      full_name,
      date_of_birth,
      gender,
      email,
      ssnit_no,
      nia_number,
      role,
      department,
      phone,
      bank_name,
      bank_branch,
      bank_account,
      salary,
      insurance_provider,
      insurance_policy_no,
      start_date,
    } = body;

    // Check staff_code uniqueness if changed
    if (staff_code) {
      const existing = await prisma.staff.findFirst({
        where: {
          staff_code,
          NOT: { id: staffId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Staff Code "${staff_code}" is taken by another staff member.` },
          { status: 400 }
        );
      }
    }

    // Update current contract start_date & end_date if provided
    if (start_date) {
      const startDateObj = parseFlexibleDate(start_date);
      if (startDateObj && !isNaN(startDateObj.getTime())) {
        const endDateObj = calculateEndDate(startDateObj);
        const currentContract = await prisma.contract.findFirst({
          where: { staff_id: staffId, is_current: true },
        });
        if (currentContract) {
          await prisma.contract.update({
            where: { id: currentContract.id },
            data: {
              start_date: startDateObj,
              end_date: endDateObj,
            },
          });
        }
      }
    }

    const updated = await (prisma as any).staff.update({
      where: { id: staffId },
      data: {
        staff_code: staff_code !== undefined ? staff_code : undefined,
        full_name: full_name !== undefined ? full_name : undefined,
        date_of_birth: date_of_birth !== undefined ? parseFlexibleDate(date_of_birth) : undefined,
        gender: gender !== undefined ? gender : undefined,
        email: email !== undefined ? email : undefined,
        ssnit_no: ssnit_no !== undefined ? ssnit_no : undefined,
        nia_number: nia_number !== undefined ? nia_number : undefined,
        role: role !== undefined ? role : undefined,
        department: department !== undefined ? department : undefined,
        phone: phone !== undefined ? phone : undefined,
        bank_name: bank_name !== undefined ? bank_name : undefined,
        bank_branch: bank_branch !== undefined ? bank_branch : undefined,
        bank_account: bank_account !== undefined ? bank_account : undefined,
        salary: salary !== undefined ? (salary ? parseFloat(salary) : null) : undefined,
      },
      include: {
        contracts: {
          orderBy: { created_at: "desc" },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/staff/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update staff details" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staffId = parseInt(id, 10);
    if (isNaN(staffId)) {
      return NextResponse.json({ success: false, error: "Invalid staff ID" }, { status: 400 });
    }

    await prisma.staff.delete({
      where: { id: staffId },
    });

    return NextResponse.json({ success: true, message: "Staff record deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/staff/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete staff record" },
      { status: 500 }
    );
  }
}
