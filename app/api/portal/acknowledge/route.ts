import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { letterId, staffId } = body;

    if (!letterId) {
      return NextResponse.json(
        { success: false, error: "Letter ID is required" },
        { status: 400 }
      );
    }

    const letter = await prisma.hrLetterDocument.findUnique({
      where: { id: letterId },
      include: { staff: true },
    });

    if (!letter) {
      return NextResponse.json(
        { success: false, error: "Letter not found" },
        { status: 404 }
      );
    }

    if (letter.status === "ACKNOWLEDGED") {
      return NextResponse.json({
        success: true,
        message: "Letter has already been acknowledged.",
        letter,
      });
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = new Date();

    const updated = await prisma.hrLetterDocument.update({
      where: { id: letterId },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: now,
      },
    });

    // Record audit log
    await prisma.hrLetterAuditLog.create({
      data: {
        action: "LETTER_ACKNOWLEDGED",
        actorName: letter.staff.fullName,
        actorRole: "STAFF_MEMBER",
        targetId: letter.id,
        targetType: "HrLetterDocument",
        details: `Letter ${letter.verificationCode} acknowledged by staff member ${letter.staff.fullName} (Staff ID: ${letter.staff.staffId}) from IP ${ip} at ${now.toISOString()}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Letter receipt successfully acknowledged.",
      acknowledgedAt: now,
      letter: updated,
    });
  } catch (error: any) {
    console.error("POST /api/portal/acknowledge error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to acknowledge letter" },
      { status: 500 }
    );
  }
}

