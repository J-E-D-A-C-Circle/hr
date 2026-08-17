import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateEndDate, formatDateDDMMYYYY } from "@/lib/status";
import { logAuditEvent } from "@/lib/audit";

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

    // Find current contract
    const currentContract = await prisma.contract.findFirst({
      where: {
        staff_id: staffId,
        is_current: true,
      },
    });

    if (!currentContract) {
      return NextResponse.json(
        { success: false, error: "No active or current contract found for this staff member." },
        { status: 404 }
      );
    }

    if (currentContract.is_terminated) {
      return NextResponse.json(
        { success: false, error: "Cannot renew a contract that has been terminated." },
        { status: 400 }
      );
    }

    // New start date is old contract's end date (or optional custom start date from request)
    let newStartDate = new Date(currentContract.end_date);
    const body = await request.json().catch(() => ({}));
    if (body.custom_start_date) {
      newStartDate = new Date(body.custom_start_date);
    }

    let newEndDate = calculateEndDate(newStartDate);
    if (body.custom_end_date) {
      const parsedCustomEnd = new Date(body.custom_end_date);
      if (!isNaN(parsedCustomEnd.getTime())) {
        newEndDate = parsedCustomEnd;
      }
    }
    const nextRenewalNumber = currentContract.renewal_number + 1;

    // Use transaction to set old contract is_current = false and create new contract
    const result = await prisma.$transaction(async (tx: any) => {
      // Mark all existing contracts for this staff as not current
      await tx.contract.updateMany({
        where: { staff_id: staffId },
        data: { is_current: false },
      });

      // Create new contract row
      const newContract = await tx.contract.create({
        data: {
          staff_id: staffId,
          start_date: newStartDate,
          end_date: newEndDate,
          renewal_number: nextRenewalNumber,
          is_current: true,
          is_terminated: false,
        },
      });

      return newContract;
    });

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });

    await logAuditEvent({
      userName: body?.user_name || "HR Admin",
      userRole: body?.user_role || "HR Manager",
      action: "RENEW",
      details: `Renewed Contract #${result.renewal_number} for ${staff?.full_name || "Staff"} (${staff?.staff_code || `#${staffId}`}) through ${formatDateDDMMYYYY(newEndDate)}`,
      staffId,
    });

    return NextResponse.json({
      success: true,
      message: `Contract renewed successfully! Renewal #${result.renewal_number}`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/staff/[id]/renew error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to renew contract" },
      { status: 500 }
    );
  }
}
