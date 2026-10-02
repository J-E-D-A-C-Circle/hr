import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFlexibleDate } from "@/lib/status";

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
    const { termination_date, termination_reason, user_name, user_role } = body;

    if (!termination_date || !termination_reason) {
      return NextResponse.json(
        { success: false, error: "Termination date and reason are required." },
        { status: 400 }
      );
    }

    const actorName = user_name || "HR Officer";
    const actorRole = user_role || "HR Officer";
    const roleUpper = actorRole.toUpperCase();

    const isApprovalAuthority =
      roleUpper.includes("APPROVAL") ||
      roleUpper.includes("MANAGER") ||
      roleUpper.includes("DIRECTOR") ||
      roleUpper.includes("INSPECTOR") ||
      roleUpper.includes("ADMIN") ||
      roleUpper.includes("SUPER");

    const parsedTerminationDate = parseFlexibleDate(termination_date) || new Date();

    const currentContract = await prisma.contract.findFirst({
      where: {
        staff_id: staffId,
        is_current: true,
      },
    });

    if (!currentContract) {
      return NextResponse.json(
        { success: false, error: "No current contract found for staff member." },
        { status: 404 }
      );
    }

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });

    // If submitted by HR Officer, submit for Approval Officer approval
    if (!isApprovalAuthority) {
      const terminationPayload = {
        requested_by: actorName,
        requested_role: actorRole,
        requested_at: new Date().toISOString(),
        type: "TERMINATION",
        termination_date: parsedTerminationDate.toISOString(),
        termination_reason: termination_reason.trim(),
      };

      const updated = await prisma.staff.update({
        where: { id: staffId },
        data: {
          pending_edits: JSON.stringify(terminationPayload),
          approval_status: "PENDING_TERMINATION_APPROVAL",
        },
      });

      await prisma.auditLog.create({
        data: {
          user_name: actorName,
          user_role: actorRole,
          action: "SUBMIT_TERMINATION_FOR_APPROVAL",
          details: `${actorName} (${actorRole}) submitted contract termination request for ${staff?.full_name || "Staff"}. Reason: ${termination_reason.trim()}. Awaiting Approval Officer review.`,
          staff_id: staffId,
        },
      });

      return NextResponse.json({
        success: true,
        isPendingApproval: true,
        message: "Contract termination request submitted to Approval Officer for review.",
        data: updated,
      });
    }

    // Direct termination execution for Approval Authorities
    const updatedContract = await prisma.contract.update({
      where: { id: currentContract.id },
      data: {
        is_terminated: true,
        termination_date: parsedTerminationDate,
        termination_reason: termination_reason.trim(),
      },
    });

    await prisma.staff.update({
      where: { id: staffId },
      data: {
        approval_status: "APPROVED",
        pending_edits: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        user_name: actorName,
        user_role: actorRole,
        action: "TERMINATE",
        details: `${actorName} (${actorRole}) terminated contract for ${staff?.full_name || "Staff"}. Reason: ${termination_reason.trim()}`,
        staff_id: staffId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contract terminated successfully.",
      data: updatedContract,
    });
  } catch (error: any) {
    console.error("POST /api/staff/[id]/terminate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to terminate contract" },
      { status: 500 }
    );
  }
}
