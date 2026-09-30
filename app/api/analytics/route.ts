import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeContractStatus } from "@/lib/status";
import { calculateGhanaDeductions } from "@/lib/payroll";

export async function GET(request: NextRequest) {
  try {
    const staffList = await prisma.staff.findMany({
      include: {
        contracts: {
          orderBy: { start_date: "desc" },
        },
        validations: {
          orderBy: { validated_at: "desc" },
        },
      },
    });

    const now = new Date();

    let totalStaff = staffList.length;
    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let terminatedCount = 0;
    let pendingApprovalCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    let totalGrossSalary = 0;
    let totalEmployerNssf = 0;
    let totalNetSalary = 0;

    // Demographic Counters
    let maleCount = 0;
    let femaleCount = 0;
    let unspecifiedGenderCount = 0;

    const ageBrackets = {
      under25: 0,
      age25to34: 0,
      age35to44: 0,
      age45to54: 0,
      age55plus: 0,
      unknown: 0,
    };

    const salaryBands = {
      under1400: 0,
      band1400to1800: 0,
      band1801to2500: 0,
      above2500: 0,
    };

    // Geographic map by station/department
    const stationMap: Record<
      string,
      {
        station: string;
        headcount: number;
        active: number;
        expiring: number;
        grossSalary: number;
        netSalary: number;
      }
    > = {};

    staffList.forEach((item: any) => {
      const currentContract = item.contracts?.find((c: any) => c.is_current) || item.contracts?.[0] || null;
      const status = computeContractStatus(currentContract);

      if (status === "Active") activeCount++;
      else if (status === "Expiring Soon") expiringCount++;
      else if (status === "Expired") expiredCount++;
      else if (status === "Terminated") terminatedCount++;

      const appStatus = item.approval_status || "APPROVED";
      if (appStatus === "PENDING_APPROVAL") pendingApprovalCount++;
      else if (appStatus === "REJECTED") rejectedCount++;
      else approvedCount++;

      const basic = item.salary ? Number(item.salary) : 1400.0;
      const deductions = calculateGhanaDeductions(basic);
      const nssf13 = Math.round(basic * 0.13 * 100) / 100;

      totalGrossSalary += basic;
      totalEmployerNssf += nssf13;
      totalNetSalary += deductions.net_take_home_salary;

      // Gender Demographic
      const g = (item.gender || "").toLowerCase();
      if (g === "male" || g === "m") maleCount++;
      else if (g === "female" || g === "f") femaleCount++;
      else unspecifiedGenderCount++;

      // Age Demographic
      if (item.date_of_birth) {
        const dob = new Date(item.date_of_birth);
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 25) ageBrackets.under25++;
        else if (age <= 34) ageBrackets.age25to34++;
        else if (age <= 44) ageBrackets.age35to44++;
        else if (age <= 54) ageBrackets.age45to54++;
        else ageBrackets.age55plus++;
      } else {
        ageBrackets.unknown++;
      }

      // Salary Bands
      if (basic < 1400) salaryBands.under1400++;
      else if (basic <= 1800) salaryBands.band1400to1800++;
      else if (basic <= 2500) salaryBands.band1801to2500++;
      else salaryBands.above2500++;

      // Geographic Breakdown
      const st = item.department || "General Office";
      if (!stationMap[st]) {
        stationMap[st] = {
          station: st,
          headcount: 0,
          active: 0,
          expiring: 0,
          grossSalary: 0,
          netSalary: 0,
        };
      }
      stationMap[st].headcount++;
      if (status === "Active") stationMap[st].active++;
      if (status === "Expiring Soon") stationMap[st].expiring++;
      stationMap[st].grossSalary += basic;
      stationMap[st].netSalary += deductions.net_take_home_salary;
    });

    const stationsList = Object.values(stationMap).sort((a, b) => b.headcount - a.headcount);

    return NextResponse.json({
      success: true,
      summary: {
        totalStaff,
        activeCount,
        expiringCount,
        expiredCount,
        terminatedCount,
        pendingApprovalCount,
        approvedCount,
        rejectedCount,
        totalGrossSalary,
        totalEmployerNssf,
        totalNetSalary,
      },
      demographics: {
        gender: {
          male: maleCount,
          female: femaleCount,
          unspecified: unspecifiedGenderCount,
          malePercent: totalStaff ? Math.round((maleCount / totalStaff) * 100) : 0,
          femalePercent: totalStaff ? Math.round((femaleCount / totalStaff) * 100) : 0,
        },
        ageBrackets,
        salaryBands,
      },
      geographics: {
        totalStations: stationsList.length,
        stations: stationsList,
      },
    });
  } catch (error: any) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load audit analytics" },
      { status: 500 }
    );
  }
}
