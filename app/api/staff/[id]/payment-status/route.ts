import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

export async function PUT(
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
    const { payment_status, unpaid_reason, user_name, user_role } = body;

    if (!payment_status || !["paid", "unpaid"].includes(payment_status)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment status. Must be 'paid' or 'unpaid'" },
        { status: 400 }
      );
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        payment_status,
        unpaid_reason: payment_status === "unpaid" ? unpaid_reason || "Payment On Hold" : null,
      },
    });

    await logAuditEvent({
      userName: user_name || "Payroll Specialist",
      userRole: user_role || "Payroll Specialist",
      action: "PAYMENT_STATUS_CHANGE",
      details: `Changed payment status of ${updatedStaff.full_name} (${updatedStaff.staff_code || `#${staffId}`}) to ${payment_status.toUpperCase()}${payment_status === "unpaid" ? ` (Reason: ${unpaid_reason || "Hold"})` : ""}`,
      staffId,
    });

    return NextResponse.json({
      success: true,
      message: `Payment status updated to ${payment_status.toUpperCase()}`,
      data: updatedStaff,
    });
  } catch (error: any) {
    console.error("PUT /api/staff/[id]/payment-status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update payment status" },
      { status: 500 }
    );
  }
}
