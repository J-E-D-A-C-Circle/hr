import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateEndDate } from "@/lib/status";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffIds, user_name, user_role } = body;

    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please select at least one staff member to renew" },
        { status: 400 }
      );
    }

    const renewedCount = await prisma.$transaction(async (tx: any) => {
      let count = 0;

      for (const rawId of staffIds) {
        const id = parseInt(String(rawId), 10);
        if (isNaN(id)) continue;

        const staff = await tx.staff.findUnique({
          where: { id },
          include: { contracts: { orderBy: { start_date: "desc" } } },
        });

        if (!staff) continue;

        const currentContract = staff.contracts.find((c: any) => c.is_current) || staff.contracts[0];

        // Archive previous current contract if exists
        if (currentContract) {
          await tx.contract.update({
            where: { id: currentContract.id },
            data: { is_current: false },
          });
        }

        // New contract start date starts from previous end date or today
        const newStartDate = currentContract?.end_date ? new Date(currentContract.end_date) : new Date();
        const newEndDate = calculateEndDate(newStartDate);
        const newRenewalNum = (currentContract?.renewal_number || 0) + 1;

        const newContract = await tx.contract.create({
          data: {
            staff_id: id,
            start_date: newStartDate,
            end_date: newEndDate,
            renewal_number: newRenewalNum,
            is_current: true,
            is_terminated: false,
          },
        });

        count++;

        // Log audit event per renewed staff
        await tx.auditLog.create({
          data: {
            user_name: user_name || "HR Admin",
            user_role: user_role || "HR Manager",
            action: "BULK_RENEW",
            details: `Bulk renewed Contract #${newRenewalNum} for ${staff.full_name} (${staff.staff_code || `#${id}`}) through ${newEndDate.toISOString().split("T")[0]}`,
            staff_id: id,
          },
        });
      }

      return count;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully bulk renewed ${renewedCount} staff contracts for 6 months!`,
      count: renewedCount,
    });
  } catch (error: any) {
    console.error("POST /api/staff/bulk-renew error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to bulk renew staff contracts" },
      { status: 500 }
    );
  }
}
