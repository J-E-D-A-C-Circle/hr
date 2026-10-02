import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateEndDate, formatDateDDMMYYYY, parseFlexibleDate } from "@/lib/status";
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
    const body = await request.json().catch(() => ({}));
    const actorName = body?.user_name || "HR Officer";
    const actorRole = body?.user_role || "HR Officer";
    const roleUpper = actorRole.toUpperCase();

    const isApprovalAuthority =
      roleUpper.includes("APPROVAL") ||
      roleUpper.includes("MANAGER") ||
      roleUpper.includes("DIRECTOR") ||
      roleUpper.includes("INSPECTOR") ||
      roleUpper.includes("ADMIN") ||
      roleUpper.includes("SUPER");

    // New start date is old contract's end date (or optional custom start date from request)
    let newStartDate = parseFlexibleDate(currentContract.end_date) || new Date();
    if (body.custom_start_date) {
      newStartDate = parseFlexibleDate(body.custom_start_date) || newStartDate;
    }

    let newEndDate = calculateEndDate(newStartDate);
    if (body.custom_end_date) {
      const parsedCustomEnd = parseFlexibleDate(body.custom_end_date);
      if (parsedCustomEnd) {
        newEndDate = parsedCustomEnd;
      }
    }
    const nextRenewalNumber = currentContract.renewal_number + 1;
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });

    // If submitted by an HR Officer (not an approval authority), send for Approval Officer review
    if (!isApprovalAuthority) {
      const renewalPayload = {
        requested_by: actorName,
        requested_role: actorRole,
        requested_at: new Date().toISOString(),
        type: "RENEWAL",
        renewal_number: nextRenewalNumber,
        new_start_date: newStartDate.toISOString(),
        new_end_date: newEndDate.toISOString(),
      };

      const updated = await prisma.staff.update({
        where: { id: staffId },
        data: {
          pending_edits: JSON.stringify(renewalPayload),
          approval_status: "PENDING_RENEWAL_APPROVAL",
        },
      });

      await logAuditEvent({
        userName: actorName,
        userRole: actorRole,
        action: "SUBMIT_RENEWAL_FOR_APPROVAL",
        details: `${actorName} (${actorRole}) submitted contract renewal request (Renewal #${nextRenewalNumber} through ${formatDateDDMMYYYY(newEndDate)}) for ${staff?.full_name || "Staff"} awaiting Approval Officer review.`,
        staffId,
      });

      return NextResponse.json({
        success: true,
        isPendingApproval: true,
        message: `Contract renewal request (Renewal #${nextRenewalNumber}) submitted to Approval Officer for review.`,
        data: updated,
      });
    }

    // Direct renewal execution for Approval Authorities
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

      await tx.staff.update({
        where: { id: staffId },
        data: {
          approval_status: "APPROVED",
          pending_edits: null,
        },
      });

      return newContract;
    });

    await logAuditEvent({
      userName: actorName,
      userRole: actorRole,
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
