import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();

    // Run parallel queries across both systems
    const [
      tempstaffCount,
      activeContractsCount,
      tempstaffSalarySum,
      retirementStaffCount,
      retirementActiveCount,
      upcomingRetirementsCount,
      retirementDeptsCount,
      adminUsersCount,
      retirementUsersCount,
      tempstaffUsersCount,
      announcementsCount,
    ] = await Promise.all([
      prisma.staff.count(),
      prisma.contract.count({ where: { is_current: true, is_terminated: false } }),
      prisma.staff.aggregate({ _sum: { salary: true } }),
      prisma.retirementStaff.count(),
      prisma.retirementStaff.count({ where: { active: true } }),
      prisma.retirementStaff.count({
        where: {
          active: true,
          retirementDate: {
            lte: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Within 1 year
          },
        },
      }),
      prisma.retirementDepartment.count(),
      prisma.adminUser.count(),
      prisma.retirementUser.count(),
      prisma.tempStaffUser.count(),
      prisma.systemAnnouncement.count({ where: { isActive: true } }),
    ]);

    const dbLatencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      metrics: {
        tempstaff: {
          totalStaff: tempstaffCount,
          activeContracts: activeContractsCount,
          totalMonthlyPayroll: tempstaffSalarySum._sum.salary || 0,
        },
        retirement: {
          totalStaff: retirementStaffCount,
          activeStaff: retirementActiveCount,
          dueThisYear: upcomingRetirementsCount,
          totalDepartments: retirementDeptsCount,
        },
        users: {
          totalAdmins: adminUsersCount,
          totalRetirementUsers: retirementUsersCount,
          totalTempstaffUsers: tempstaffUsersCount,
          grandTotalUsers: adminUsersCount + retirementUsersCount + tempstaffUsersCount,
        },
        system: {
          activeAnnouncements: announcementsCount,
          dbStatus: "HEALTHY",
          dbLatencyMs,
          serverTime: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error("Admin Stats API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
  }
}
