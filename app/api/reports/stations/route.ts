import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeStation } from "@/lib/stations";
import { CALENDAR_MONTHS } from "@/lib/status";

function parseMonthIndex(monthParam: string): number | null {
  if (!monthParam || monthParam.toLowerCase() === "all") return null;
  const num = parseInt(monthParam, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num;
  const idx = CALENDAR_MONTHS.findIndex(
    (m) => m.toLowerCase() === monthParam.trim().toLowerCase()
  );
  return idx >= 0 ? idx + 1 : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentYear = new Date().getFullYear();
    const yearParam = searchParams.get("year") || String(currentYear);
    const monthParam = searchParams.get("month") || "all";
    const stationParam = searchParams.get("station") || "";

    const targetYear =
      yearParam.toLowerCase() === "all" ? null : parseInt(yearParam, 10) || currentYear;
    const targetMonth = parseMonthIndex(monthParam);
    const targetStation = stationParam ? normalizeStation(stationParam) : "";

    const staffList = await prisma.staff.findMany({
      select: {
        id: true,
        staff_code: true,
        full_name: true,
        department: true,
        created_at: true,
        approval_status: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const yearsSet = new Set<number>([currentYear]);
    const monthlyCounts = CALENDAR_MONTHS.map((name, idx) => ({
      monthIndex: idx + 1,
      monthName: name,
      totalAdded: 0,
      stationAdded: 0,
    }));

    const stationMap = new Map<string, { station: string; totalStaff: number; addedInPeriod: number }>();

    let addedInYear = 0;
    let addedInMonth = 0;
    let stationTotal = 0;
    let stationAddedInYear = 0;
    let stationAddedInMonth = 0;

    for (const s of staffList) {
      const canonical = normalizeStation(s.department) || "UNASSIGNED";
      const createdAt = s.created_at ? new Date(s.created_at) : null;
      const y = createdAt ? createdAt.getFullYear() : null;
      const m = createdAt ? createdAt.getMonth() + 1 : null;

      if (y) yearsSet.add(y);

      const matchesYear = targetYear === null || y === targetYear;
      const matchesMonth = targetMonth === null || m === targetMonth;
      const matchesPeriod = matchesYear && matchesMonth;
      const matchesStation = !targetStation || canonical === targetStation;

      if (!stationMap.has(canonical)) {
        stationMap.set(canonical, { station: canonical, totalStaff: 0, addedInPeriod: 0 });
      }
      const stEntry = stationMap.get(canonical)!;
      stEntry.totalStaff += 1;
      if (matchesPeriod) {
        stEntry.addedInPeriod += 1;
      }

      if (matchesYear) {
        addedInYear += 1;
        if (m && m >= 1 && m <= 12) {
          monthlyCounts[m - 1].totalAdded += 1;
          if (targetStation && canonical === targetStation) {
            monthlyCounts[m - 1].stationAdded += 1;
          }
        }
      }

      if (matchesPeriod) {
        addedInMonth += 1;
      }

      if (targetStation && matchesStation) {
        stationTotal += 1;
        if (matchesYear) stationAddedInYear += 1;
        if (matchesPeriod) stationAddedInMonth += 1;
      }
    }

    const stationBreakdown = Array.from(stationMap.values()).sort((a, b) => {
      if (b.addedInPeriod !== a.addedInPeriod) return b.addedInPeriod - a.addedInPeriod;
      if (b.totalStaff !== a.totalStaff) return b.totalStaff - a.totalStaff;
      return a.station.localeCompare(b.station);
    });

    const availableYears = Array.from(yearsSet).sort((a, b) => b - a).map(String);

    return NextResponse.json({
      success: true,
      data: {
        overallTotal: staffList.length,
        addedInYear,
        addedInMonth,
        selectedStation: targetStation || null,
        stationTotal,
        stationAddedInYear,
        stationAddedInMonth,
        monthlyBreakdown: monthlyCounts,
        stationBreakdown,
        availableYears,
      },
    });
  } catch (error: any) {
    console.error("GET /api/reports/stations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate station report" },
      { status: 500 }
    );
  }
}
