import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeContractStatus, computeDaysRemaining, ContractStatus } from "@/lib/status";

export async function GET() {
  try {
    const staffList = await prisma.staff.findMany({
      include: {
        contracts: {
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    const statusCounts: Record<ContractStatus, number> = {
      Active: 0,
      "Expiring Soon": 0,
      Expired: 0,
      Terminated: 0,
      "No Contract": 0,
    };

    const upcomingExpirations: any[] = [];
    const departmentCounts: Record<string, number> = {};

    staffList.forEach((staff) => {
      const currentContract = staff.contracts.find((c) => c.is_current) || staff.contracts[0] || null;
      const status = computeContractStatus(currentContract);

      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Track department distribution
      const dept = staff.department || "Unassigned";
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

      // Collect expiring soon list (<= 30 days)
      if (status === "Expiring Soon" && currentContract) {
        const daysRemaining = computeDaysRemaining(currentContract.end_date);
        upcomingExpirations.push({
          id: staff.id,
          staff_code: staff.staff_code || `EMP-${staff.id}`,
          full_name: staff.full_name,
          department: staff.department,
          role: staff.role,
          phone: staff.phone,
          end_date: currentContract.end_date,
          renewal_number: currentContract.renewal_number,
          daysRemaining,
        });
      }
    });

    // Sort upcoming expirations by days remaining ascending (most urgent first)
    upcomingExpirations.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return NextResponse.json({
      success: true,
      data: {
        totalStaff: staffList.length,
        statusCounts,
        upcomingExpirations,
        departmentCounts,
      },
    });
  } catch (error: any) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
