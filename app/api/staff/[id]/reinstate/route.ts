import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateEndDate } from "@/lib/status";

export async function POST(
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
    const { new_gross_salary, new_start_date, role, department } = body;

    if (!new_start_date) {
      return NextResponse.json(
        { success: false, error: "New Contract Start Date is required for reinstatement." },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        contracts: {
          orderBy: { renewal_number: "desc" },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    const lastContract = staff.contracts[0] || null;
    const nextRenewalNumber = lastContract ? lastContract.renewal_number + 1 : 1;

    const startDateObj = new Date(new_start_date);
    const endDateObj = calculateEndDate(startDateObj);
    const grossSalaryNum = new_gross_salary ? parseFloat(new_gross_salary) : staff.salary;

    // Transaction to update staff details and insert new active contract
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Mark all previous contracts as not current
      await tx.contract.updateMany({
        where: { staff_id: staffId },
        data: { is_current: false },
      });

      // 2. Update staff gross salary and optional role/dept
      await tx.staff.update({
        where: { id: staffId },
        data: {
          salary: grossSalaryNum,
          role: role || staff.role,
          department: department || staff.department,
        },
      });

      // 3. Create new active contract
      const newContract = await tx.contract.create({
        data: {
          staff_id: staffId,
          start_date: startDateObj,
          end_date: endDateObj,
          renewal_number: nextRenewalNumber,
          is_current: true,
          is_terminated: false,
          termination_date: null,
          termination_reason: null,
        },
      });

      return newContract;
    });

    return NextResponse.json({
      success: true,
      message: `${staff.full_name} has been successfully reinstated with Gross Salary $${grossSalaryNum?.toFixed(2)}!`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/staff/[id]/reinstate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reinstate staff member." },
      { status: 500 }
    );
  }
}
