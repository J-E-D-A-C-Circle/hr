import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHrLettersSession } from "@/lib/hrletters-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const letter = await prisma.hrLetterDocument.findUnique({
      where: { id },
      include: { staff: true, approvalWorkflows: true },
    });

    if (!letter) return NextResponse.json({ success: false, error: "Letter not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: letter });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getHrLettersSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { status, action, digitalSignature, signatoryName, signatoryTitle, signedAt, issuedAt, details } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (digitalSignature) updateData.digitalSignature = digitalSignature;
    if (signatoryName) updateData.signatoryName = signatoryName;
    if (signatoryTitle) updateData.signatoryTitle = signatoryTitle;
    if (signedAt) updateData.signedAt = new Date(signedAt);
    if (issuedAt) updateData.issuedAt = new Date(issuedAt);
    if (status === "ACKNOWLEDGED") updateData.acknowledgedAt = new Date();

    const letter = await prisma.hrLetterDocument.update({
      where: { id },
      data: updateData,
      include: { staff: true },
    });

    // Audit
    await prisma.hrLetterAuditLog.create({
      data: {
        action: action || "LETTER_UPDATED",
        actorName: session.fullName,
        actorRole: session.role,
        targetId: id,
        targetType: "HrLetterDocument",
        details: details || `Letter status updated to ${status}`,
      },
    });

    return NextResponse.json({ success: true, data: letter });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
