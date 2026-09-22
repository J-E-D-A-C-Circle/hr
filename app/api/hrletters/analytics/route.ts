import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHrLettersSession } from "@/lib/hrletters-auth";

export async function GET() {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [totalLetters, byStatus, byType, recentAuditLogs] = await Promise.all([
      prisma.hrLetterDocument.count(),
      prisma.hrLetterDocument.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.hrLetterDocument.groupBy({ by: ["letterType"], _count: { id: true } }),
      prisma.hrLetterAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    const statusCounts: Record<string, number> = {};
    byStatus.forEach((s) => { statusCounts[s.status] = s._count.id; });

    const typeCounts: Record<string, number> = {};
    byType.forEach((t) => { typeCounts[t.letterType] = t._count.id; });

    return NextResponse.json({
      success: true,
      data: { totalLetters, statusCounts, typeCounts, recentAuditLogs },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
