import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const search = searchParams.get("search");

    const whereClause: any = {};
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

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      take: 200,
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
