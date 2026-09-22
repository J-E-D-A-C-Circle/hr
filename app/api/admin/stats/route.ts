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

    // Run parallel queries across all three systems
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
      hrLettersUsersCount,
      announcementsCount,
      hrLettersTotalCount,
      hrLettersPendingCount,
      hrLettersIssuedCount,
      hrLettersDraftCount,
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
            lte: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.retirementDepartment.count(),
      prisma.adminUser.count(),
      prisma.retirementUser.count(),
      prisma.tempStaffUser.count(),
      prisma.hrLetterUser.count(),
      prisma.systemAnnouncement.count({ where: { isActive: true } }),
      prisma.hrLetterDocument.count(),
      prisma.hrLetterDocument.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.hrLetterDocument.count({ where: { status: "ISSUED" } }),
      prisma.hrLetterDocument.count({ where: { status: "DRAFT" } }),
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
        hrLetters: {
          totalLetters: hrLettersTotalCount,
          pendingApproval: hrLettersPendingCount,
          issued: hrLettersIssuedCount,
          drafts: hrLettersDraftCount,
          totalUsers: hrLettersUsersCount,
        },
        users: {
          totalAdmins: adminUsersCount,
          totalRetirementUsers: retirementUsersCount,
          totalTempstaffUsers: tempstaffUsersCount,
          totalHrLettersUsers: hrLettersUsersCount,
          grandTotalUsers: adminUsersCount + retirementUsersCount + tempstaffUsersCount + hrLettersUsersCount,
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
