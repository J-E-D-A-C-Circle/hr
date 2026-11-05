import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Staff ID or Email is required" },
        { status: 400 }
      );
    }

    const staffMember = await prisma.hrLetterStaff.findFirst({
      where: {
        OR: [
          { staffId: { equals: query } },
          { email: { equals: query } },
        ],
      },
      include: {
        letters: {
          where: {
            status: { in: ["ISSUED", "APPROVED", "ACKNOWLEDGED"] },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!staffMember) {
      return NextResponse.json(
        { success: false, error: "No employee record found for " + query },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: {
        id: staffMember.id,
        staffId: staffMember.staffId,
        fullName: staffMember.fullName,
        department: staffMember.department,
        jobTitle: staffMember.jobTitle,
        email: staffMember.email,
        phone: staffMember.phone,
        status: staffMember.status,
      },
      letters: staffMember.letters,
    });
  } catch (error: any) {
    console.error("GET /api/portal/letters error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch employee letters" },
      { status: 500 }
    );
  }
}

