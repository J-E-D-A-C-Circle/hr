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

    const body = await request.json();
    const { user_name, user_role, rejection_reason } = body;

    if (!rejection_reason || !rejection_reason.trim()) {
      return NextResponse.json(
        { success: false, error: "A rejection reason is required." },
        { status: 400 }
      );
    }

    const actorName = user_name || "Approval Officer";
    const actorRole = user_role || "Approval Officer";

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        approval_status: "REJECTED",
        rejection_reason: rejection_reason.trim(),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_name: actorName,
        user_role: actorRole,
        action: "REJECT",
        details: `${actorName} (${actorRole}) rejected temporary staff submission for ${staff.full_name} (${staff.staff_code || `EMP-${staff.id}`}). Reason: ${rejection_reason.trim()}`,
        staff_id: staffId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Staff submission for ${staff.full_name} was rejected.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/staff/[id]/reject error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reject staff member" },
      { status: 500 }
    );
  }
}
