import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeContractStatus } from "@/lib/status";

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
    const { new_department, transfer_reason, user_name, user_role } = body;

    if (!new_department || !new_department.trim()) {
      return NextResponse.json({ success: false, error: "New Station / Department is required." }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        contracts: { orderBy: { created_at: "desc" } },
      },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    const currentContract = staff.contracts.find((c: any) => c.is_current) || staff.contracts[0];
    const status = computeContractStatus(currentContract);

    if (status !== "Active") {
      return NextResponse.json(
        { success: false, error: `Station Transfer is only allowed for active contract staff. Current status: ${status}` },
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

    const oldStation = staff.department || "Unassigned Station";
    const targetStation = new_department.trim();
    const reasonText = transfer_reason ? transfer_reason.trim() : "Operational re-assignment";

    // If submitted by HR Officer, submit for Approval Officer approval
    if (!isApprovalAuthority) {
      const editPayload = {
        requested_by: actorName,
        requested_role: actorRole,
        requested_at: new Date().toISOString(),
        changes: {
          department: targetStation,
          transfer_reason: reasonText,
          old_department: oldStation,
        },
      };

      const updated = await prisma.staff.update({
        where: { id: staffId },
        data: {
          pending_edits: JSON.stringify(editPayload),
          approval_status: "PENDING_TRANSFER_APPROVAL",
        },
      });

      await prisma.auditLog.create({
        data: {
          user_name: actorName,
          user_role: actorRole,
          action: "SUBMIT_TRANSFER_FOR_APPROVAL",
          details: `${actorName} (${actorRole}) submitted station transfer request for ${staff.full_name} from ${oldStation} to ${targetStation}. Reason: ${reasonText}. Awaiting Approval Officer review.`,
          staff_id: staffId,
        },
      });

      return NextResponse.json({
        success: true,
        isPendingApproval: true,
        message: "Station transfer request submitted to Approval Officer for review.",
        data: updated,
      });
    }

    // Immediate transfer execution for Approval Authorities
    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        department: targetStation,
        pending_edits: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        user_name: actorName,
        user_role: actorRole,
        action: "STATION_TRANSFER",
        details: `${actorName} (${actorRole}) transferred ${staff.full_name} from ${oldStation} to ${targetStation}. Reason: ${reasonText}`,
        staff_id: staffId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Staff member ${staff.full_name} successfully transferred to ${targetStation}.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/staff/[id]/transfer error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to transfer staff member station" },
      { status: 500 }
    );
  }
}
