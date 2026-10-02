import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession, isManagerOrAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !isManagerOrAdminSession(session)) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Audit logs access is restricted to HR Managers and Administrators." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const search = searchParams.get("search");
    const staffIdParam = searchParams.get("staff_id");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const whereClause: any = {};
    if (staffIdParam) {
      whereClause.staff_id = parseInt(staffIdParam, 10);
    }
    if (action && action !== "all") {
      whereClause.action = action;
    }
    if (search && search.trim() !== "") {
      whereClause.OR = [
        { details: { contains: search } },
        { user_name: { contains: search } },
        { user_role: { contains: search } },
      ];
    }

    // Month & Year filtering
    if (year && year !== "all") {
      const y = parseInt(year, 10);
      if (!isNaN(y)) {
        let startDate: Date;
        let endDate: Date;

        if (month && month !== "all") {
          const m = parseInt(month, 10) - 1; // 0-indexed in JS Date
          startDate = new Date(y, m, 1, 0, 0, 0, 0);
          endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
        } else {
          startDate = new Date(y, 0, 1, 0, 0, 0, 0);
          endDate = new Date(y, 11, 31, 23, 59, 59, 999);
        }

        whereClause.created_at = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      take: 500,
    });

    return NextResponse.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error: any) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load audit logs" },
      { status: 500 }
    );
  }
}
