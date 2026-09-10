import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const [tempstaffLogs, retirementLogs] = await Promise.all([
      prisma.auditLog.findMany({
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.retirementAuditLog.findMany({
        take: limit,
        orderBy: { created_at: "desc" },
      }),
    ]);

    const combined = [
      ...tempstaffLogs.map((log: any) => ({
        id: `temp_${log.id}`,
        system: "TEMPSTAFF",
        userName: log.user_name,
        userRole: log.user_role,
        action: log.action,
        details: log.details,
        createdAt: log.created_at,
      })),
      ...retirementLogs.map((log: any) => ({
        id: `ret_${log.id}`,
        system: "RETIREMENT",
        userName: log.userName,
        userRole: log.userRole,
        action: log.action,
        details: log.details,
        createdAt: log.created_at,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      logs: combined.slice(0, limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch audit logs" }, { status: 500 });
  }
}
