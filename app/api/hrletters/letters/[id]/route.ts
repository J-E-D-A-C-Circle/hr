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
    const { status, action, digitalSignature, signatoryName, signatoryTitle, signedAt, issuedAt, details, rejectionReason } = body;

    // ── RBAC Gate ────────────────────────────────────────────────────────────
    const OFFICER_ALLOWED_TRANSITIONS = ["DRAFT", "PENDING_APPROVAL"];      // Officer can only draft or submit
    const DIRECTOR_ALLOWED_TRANSITIONS = ["APPROVED", "ISSUED", "REJECTED"]; // Director approves, issues, or rejects

    if (status) {
      if (session.role === "HR_OFFICER" && !OFFICER_ALLOWED_TRANSITIONS.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Access Denied: HR Officers cannot set status to '${status}'. Only the HR Director can approve, sign, or issue letters.` },
          { status: 403 }
        );
      }
      if (session.role === "HR_DIRECTOR" && !DIRECTOR_ALLOWED_TRANSITIONS.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status transition to '${status}' for HR Director.` },
          { status: 400 }
        );
      }
    }

    // HR_OFFICER cannot attach a digital signature (signing = director only)
    if (digitalSignature && session.role === "HR_OFFICER") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Only the HR Director can digitally sign letters." },
        { status: 403 }
      );
    }

    // ── Build update payload ──────────────────────────────────────────────────
    const updateData: any = {};
    if (status) updateData.status = status;
    if (digitalSignature) updateData.digitalSignature = digitalSignature;
    if (signatoryName) updateData.signatoryName = signatoryName;
    if (signatoryTitle) updateData.signatoryTitle = signatoryTitle;
    if (signedAt) updateData.signedAt = new Date(signedAt);
    if (issuedAt) updateData.issuedAt = new Date(issuedAt);
    if (status === "ISSUED" && !issuedAt) updateData.issuedAt = new Date();
    if (status === "APPROVED" || status === "ISSUED") {
      updateData.signedAt = new Date();
    }

    const letter = await prisma.hrLetterDocument.update({
      where: { id },
      data: updateData,
      include: { staff: true },
    });

    // Update approval workflow record if applicable
    if (status === "APPROVED" || status === "REJECTED") {
      await prisma.hrApprovalWorkflow.updateMany({
        where: { letterId: id, status: "PENDING" },
        data: {
          status: status === "APPROVED" ? "APPROVED" : "REJECTED",
          approverName: session.fullName,
          approverRole: session.role,
          comments: rejectionReason || details || null,
          decidedAt: new Date(),
        },
      });
    }

    // Audit log
    const actionMap: Record<string, string> = {
      APPROVED: "LETTER_APPROVED",
      ISSUED: "LETTER_ISSUED",
      REJECTED: "LETTER_REJECTED",
      DRAFT: "LETTER_RETURNED_TO_DRAFT",
      PENDING_APPROVAL: "LETTER_SUBMITTED",
    };

    await prisma.hrLetterAuditLog.create({
      data: {
        action: action || actionMap[status] || "LETTER_UPDATED",
        actorName: session.fullName,
        actorRole: session.role,
        targetId: id,
        targetType: "HrLetterDocument",
        details: rejectionReason
          ? `Rejected with reason: ${rejectionReason}`
          : details || `Letter status updated to ${status}`,
      },
    });

    return NextResponse.json({ success: true, data: letter });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
