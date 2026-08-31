import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const totalStaff = await prisma.staff.count();
    const totalTemplates = await prisma.letterTemplate.count();
    const totalLetters = await prisma.letterDocument.count();
    const pendingApprovals = await prisma.letterDocument.count({ where: { status: "PENDING_APPROVAL" } });
    const issuedLetters = await prisma.letterDocument.count({ where: { status: "ISSUED" } });
    const acknowledgedLetters = await prisma.letterDocument.count({ where: { status: "ACKNOWLEDGED" } });

    const totalVacancies = await prisma.vacancy.count();
    const totalApplications = await prisma.candidateApplication.count();
    const shortlistedCandidates = await prisma.candidateApplication.count({ where: { isShortlisted: true } });
    const interviewedCandidates = await prisma.candidateApplication.count({ where: { status: "INTERVIEWED" } });
    const selectedCandidates = await prisma.candidateApplication.count({ where: { status: "SELECTED" } });

    const recentAudits = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalStaff,
        totalTemplates,
        totalLetters,
        pendingApprovals,
        issuedLetters,
        acknowledgedLetters,
        acknowledgmentRate: totalLetters > 0 ? Math.round((acknowledgedLetters / totalLetters) * 100) : 0,
        totalVacancies,
        totalApplications,
        shortlistedCandidates,
        shortlistingRate: totalApplications > 0 ? Math.round((shortlistedCandidates / totalApplications) * 100) : 0,
        interviewedCandidates,
        selectedCandidates,
        recentAudits,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
