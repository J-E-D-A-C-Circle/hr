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
    const { user_name, user_role, notes } = body;

    const actorName = user_name || "Approval Officer";
    const actorRole = user_role || "Approval Officer";

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        approval_status: "APPROVED",
        approved_by: actorName,
        approved_at: new Date(),
        rejection_reason: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        user_name: actorName,
        user_role: actorRole,
        action: "APPROVE",
        details: `${actorName} (${actorRole}) approved temporary staff submission for ${staff.full_name} (${staff.staff_code || `EMP-${staff.id}`}). ${notes ? `Notes: ${notes}` : ""}`.trim(),
        staff_id: staffId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Staff member ${staff.full_name} approved successfully.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/staff/[id]/approve error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve staff member" },
      { status: 500 }
    );
  }
}
