import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const body = await request.json().catch(() => ({}));
    const actorName = body.user_name || "Approval Officer";
    const actorRole = body.user_role || "Approval Officer";
    const rejectionReason = body.rejection_reason || "Edit request declined by Approval Officer.";

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    let parsedEdits: any = {};
    if (staff.pending_edits) {
      try {
        parsedEdits = JSON.parse(staff.pending_edits);
      } catch {}
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        pending_edits: null,
        approval_status: "APPROVED",
        rejection_reason: rejectionReason,
      },
    });

    const requesterName = parsedEdits.requested_by || "HR Officer";
    await prisma.auditLog.create({
      data: {
        user_name: actorName,
        user_role: actorRole,
        action: "REJECT_EDIT",
        details: `${actorName} (${actorRole}) REJECTED employee edit request for ${updated.full_name} submitted by ${requesterName}. Reason: ${rejectionReason}`,
        staff_id: staffId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Employee edit request for ${updated.full_name} has been rejected.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/staff/[id]/reject-edit error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reject staff edit request" },
      { status: 500 }
    );
  }
}
