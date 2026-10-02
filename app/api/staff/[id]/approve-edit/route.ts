import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateEndDate, parseFlexibleDate } from "@/lib/status";

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

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    if (!staff.pending_edits) {
      return NextResponse.json({ success: false, error: "No pending edit request found for this staff member." }, { status: 400 });
    }

    let parsedEdits: any = {};
    try {
      parsedEdits = JSON.parse(staff.pending_edits);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid pending edit payload" }, { status: 400 });
    }

    const changes = parsedEdits.changes || {};

    // Check staff_code uniqueness if changed
    if (changes.staff_code && changes.staff_code !== staff.staff_code) {
      const existing = await prisma.staff.findFirst({
        where: {
          staff_code: changes.staff_code,
          NOT: { id: staffId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Staff Code "${changes.staff_code}" is taken by another staff member.` },
          { status: 400 }
        );
      }
    }

    // Update current contract start_date & end_date if provided in changes
    if (changes.start_date || changes.end_date) {
      const currentContract = await prisma.contract.findFirst({
        where: { staff_id: staffId, is_current: true },
      });

      if (currentContract) {
        const startDateObj = changes.start_date ? parseFlexibleDate(changes.start_date) : currentContract.start_date;
        let endDateObj = currentContract.end_date;

        if (changes.end_date) {
          const parsedEnd = parseFlexibleDate(changes.end_date);
          if (parsedEnd && !isNaN(parsedEnd.getTime())) {
            endDateObj = parsedEnd;
          }
        } else if (changes.start_date && startDateObj) {
          endDateObj = calculateEndDate(startDateObj);
        }

        await prisma.contract.update({
          where: { id: currentContract.id },
          data: {
            start_date: startDateObj || currentContract.start_date,
            end_date: endDateObj,
          },
        });
      }
    }

    // Apply edits to staff record
    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        staff_code: changes.staff_code !== undefined ? changes.staff_code : undefined,
        full_name: changes.full_name !== undefined ? changes.full_name : undefined,
        date_of_birth: changes.date_of_birth !== undefined ? parseFlexibleDate(changes.date_of_birth) : undefined,
        gender: changes.gender !== undefined ? changes.gender : undefined,
        email: changes.email !== undefined ? changes.email : undefined,
        ssnit_no: changes.ssnit_no !== undefined ? changes.ssnit_no : undefined,
        nia_number: changes.nia_number !== undefined ? changes.nia_number : undefined,
        role: changes.role !== undefined ? changes.role : undefined,
        department: changes.department !== undefined ? changes.department : undefined,
        phone: changes.phone !== undefined ? changes.phone : undefined,
        bank_name: changes.bank_name !== undefined ? changes.bank_name : undefined,
        bank_branch: changes.bank_branch !== undefined ? changes.bank_branch : undefined,
        bank_account: changes.bank_account !== undefined ? changes.bank_account : undefined,
        salary: changes.salary !== undefined ? (changes.salary ? parseFloat(changes.salary) : null) : undefined,
        approval_status: "APPROVED",
        approved_by: actorName,
        approved_at: new Date(),
        pending_edits: null,
      },
    });

    const requesterName = parsedEdits.requested_by || "HR Officer";
    await prisma.auditLog.create({
      data: {
        user_name: actorName,
        user_role: actorRole,
        action: "APPROVE_EDIT",
        details: `${actorName} (${actorRole}) APPROVED employee edit request for ${updated.full_name} submitted by ${requesterName}.`,
        staff_id: staffId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Employee edit request for ${updated.full_name} has been approved and applied.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/staff/[id]/approve-edit error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve staff edit request" },
      { status: 500 }
    );
  }
}
