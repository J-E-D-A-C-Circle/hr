import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const letter = await prisma.letterDocument.findUnique({
      where: { id },
      include: {
        staff: true,
        approvalWorkflows: true,
      },
    });
    if (!letter) {
      return NextResponse.json({ success: false, error: "Letter not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: letter });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.digitalSignature) updateData.digitalSignature = body.digitalSignature;
    if (body.signatoryName) updateData.signatoryName = body.signatoryName;
    if (body.signatoryTitle) updateData.signatoryTitle = body.signatoryTitle;
    if (body.signedAt) updateData.signedAt = new Date(body.signedAt);
    if (body.issuedAt) updateData.issuedAt = new Date(body.issuedAt);
    if (body.acknowledgedAt) {
      updateData.acknowledgedAt = new Date(body.acknowledgedAt);
      updateData.acknowledgmentIp = body.acknowledgmentIp || "127.0.0.1";
    }

    const updatedLetter = await prisma.letterDocument.update({
      where: { id },
      data: updateData,
      include: { staff: true, approvalWorkflows: true },
    });

    // Audit action
    let action = "LETTER_UPDATED";
    if (body.action) action = body.action;

    await prisma.auditLog.create({
      data: {
        action,
        actorName: body.actorName || "System User",
        actorRole: body.actorRole || "HR Role",
        targetId: updatedLetter.id,
        targetType: "LetterDocument",
        details: body.details || `Letter status updated to ${updatedLetter.status}`,
      },
    });

    // Notify employee if issued
    if (body.status === "ISSUED") {
      await prisma.notification.create({
        data: {
          recipientEmail: updatedLetter.staff.email,
          recipientRole: "Staff",
          channel: "EMAIL",
          subject: `Your ${updatedLetter.letterType} Letter has been Issued`,
          message: `Your ${updatedLetter.title} has been approved and issued to your staff portal account. Please log in to view and acknowledge receipt.`,
        },
      });
    }

    return NextResponse.json({ success: true, data: updatedLetter });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
