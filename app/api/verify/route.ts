import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Verification code is required" },
        { status: 400 }
      );
    }

    const letter = await prisma.hrLetterDocument.findUnique({
      where: { verificationCode: code },
      include: {
        staff: true,
        template: {
          select: { title: true, type: true },
        },
      },
    });

    if (!letter) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "No official DVLA HR letter found matching verification code " + code,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      document: {
        verificationCode: letter.verificationCode,
        title: letter.title,
        letterType: letter.letterType,
        recipientName: letter.staff?.fullName || "Official Personnel",
        recipientStaffId: letter.staff?.staffId || "N/A",
        department: letter.staff?.department || "DVLA Authority",
        positionTitle: letter.staff?.jobTitle || "Officer",
        status: letter.status,
        issuedAt: letter.issuedAt,
        signedAt: letter.signedAt,
        effectiveDate: letter.effectiveDate,
        signatoryName: letter.signatoryName || "EPHRAIM NII TAN SACKEY",
        signatoryTitle: letter.signatoryTitle || "AG. DIRECTOR, HUMAN RESOURCE",
        customRefNumber: letter.customRefNumber,
        acknowledgedAt: letter.acknowledgedAt,
      },
    });
  } catch (error: any) {
    console.error("GET /api/verify error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify document" },
      { status: 500 }
    );
  }
}

