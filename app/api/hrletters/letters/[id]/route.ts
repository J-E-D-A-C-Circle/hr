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
      include: {
        staff: true,
        approvalWorkflows: { orderBy: { stepNumber: "asc" } },
      },
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
    const {
      status,
      action,
      digitalSignature,
      signatoryName,
      signatoryTitle,
      signatoryForTitle,
      rejectionReason,
      comments,
      content,
      title,
      customRefNumber,
      yourRef,
      effectiveDate,
      salaryGrade,
      applicantAddress,
      salutation,
      ccText,
    } = body;

    // 1. Fetch current document state
    const currentLetter = await prisma.hrLetterDocument.findUnique({
      where: { id },
      include: { staff: true, approvalWorkflows: true },
    });

    if (!currentLetter) {
      return NextResponse.json({ success: false, error: "Letter document not found" }, { status: 404 });
    }

    const currentStatus = currentLetter.status;
    const targetStatus = status || currentStatus;

    // 2. Immutability Guard: Once ISSUED or ACKNOWLEDGED, letter content & status are permanently locked
    if ((currentStatus === "ISSUED" || currentStatus === "ACKNOWLEDGED") && targetStatus !== currentStatus) {
      if (currentStatus === "ISSUED" && targetStatus === "ACKNOWLEDGED") {
        // Allowed employee acknowledgment flow
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Document is permanently locked. Officially issued letters cannot be modified or reverted to '${targetStatus}'.`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Strict State Machine Transitions & Role Verification
    if (targetStatus !== currentStatus) {
      switch (currentStatus) {
        case "DRAFT":
          // DRAFT can only advance to PENDING_APPROVAL
          if (targetStatus !== "PENDING_APPROVAL") {
            return NextResponse.json(
              {
                success: false,
                error: `Invalid lifecycle transition: A Draft letter cannot skip directly to '${targetStatus}'. It must first be submitted for approval ('PENDING_APPROVAL').`,
              },
              { status: 400 }
            );
          }
          break;

        case "PENDING_APPROVAL":
          // PENDING_APPROVAL can move to APPROVED (Director only), REJECTED (Director only), or DRAFT (Retract)
          if (targetStatus === "APPROVED" || targetStatus === "REJECTED") {
            if (session.role !== "HR_DIRECTOR") {
              return NextResponse.json(
                {
                  success: false,
                  error: "Access Denied: Only the HR Director has authority to approve or reject letters.",
                },
                { status: 403 }
              );
            }
            if (targetStatus === "REJECTED" && !rejectionReason?.trim() && !comments?.trim()) {
              return NextResponse.json(
                {
                  success: false,
                  error: "A rejection reason / feedback note is required when requesting revisions.",
                },
                { status: 400 }
              );
            }
          } else if (targetStatus === "DRAFT") {
            // Retract draft by officer or director
          } else {
            return NextResponse.json(
              {
                success: false,
                error: `Invalid transition from 'PENDING_APPROVAL' to '${targetStatus}'. An official director decision (APPROVED or REJECTED) is required before issuance.`,
              },
              { status: 400 }
            );
          }
          break;

        case "REJECTED":
          // REJECTED letters can be edited as DRAFT or re-submitted as PENDING_APPROVAL
          if (targetStatus !== "DRAFT" && targetStatus !== "PENDING_APPROVAL") {
            return NextResponse.json(
              {
                success: false,
                error: `Rejected letters can only be edited (DRAFT) or re-submitted for approval (PENDING_APPROVAL). Cannot jump to '${targetStatus}'.`,
              },
              { status: 400 }
            );
          }
          break;

        case "APPROVED":
          // APPROVED letters can move to ISSUED (Director only, requires digital signature) or revoked to REJECTED/DRAFT
          if (targetStatus === "ISSUED") {
            if (session.role !== "HR_DIRECTOR") {
              return NextResponse.json(
                {
                  success: false,
                  error: "Access Denied: Only the HR Director can digitally sign and issue official letters.",
                },
                { status: 403 }
              );
            }
            if (!digitalSignature || !digitalSignature.trim()) {
              return NextResponse.json(
                {
                  success: false,
                  error: "Digital signature is mandatory. An official letter cannot be issued without the HR Director's cryptographic digital signature.",
                },
                { status: 400 }
              );
            }
          } else if (targetStatus === "REJECTED" || targetStatus === "DRAFT") {
            if (session.role !== "HR_DIRECTOR") {
              return NextResponse.json(
                {
                  success: false,
                  error: "Access Denied: Only the HR Director can revoke an approved letter.",
                },
                { status: 403 }
              );
            }
          } else {
            return NextResponse.json(
              {
                success: false,
                error: `Invalid transition from 'APPROVED' to '${targetStatus}'.`,
              },
              { status: 400 }
            );
          }
          break;

        default:
          break;
      }
    }

    // 4. Content updates: Only allowed on unissued drafts / revisions
    const updateData: any = {};
    if (
      currentStatus === "DRAFT" ||
      currentStatus === "REJECTED" ||
      (currentStatus === "PENDING_APPROVAL" && session.role === "HR_DIRECTOR")
    ) {
      if (content !== undefined) updateData.content = content;
      if (title !== undefined) updateData.title = title;
      if (customRefNumber !== undefined) updateData.customRefNumber = customRefNumber;
      if (yourRef !== undefined) updateData.yourRef = yourRef;
      if (effectiveDate !== undefined) updateData.effectiveDate = effectiveDate;
      if (salaryGrade !== undefined) updateData.salaryGrade = salaryGrade;
      if (applicantAddress !== undefined) updateData.applicantAddress = applicantAddress;
      if (salutation !== undefined) updateData.salutation = salutation;
      if (ccText !== undefined) updateData.ccText = ccText;
    }

    // 5. Status & Signature updates
    if (targetStatus !== currentStatus) {
      updateData.status = targetStatus;
    }

    if (targetStatus === "APPROVED") {
      updateData.signedAt = new Date();
    }

    if (targetStatus === "ISSUED") {
      updateData.digitalSignature = digitalSignature;
      updateData.signatoryName = signatoryName || session.fullName || "EPHRAIM NII TAN SACKEY";
      updateData.signatoryTitle = signatoryTitle || "AG. DIRECTOR, HUMAN RESOURCE";
      if (signatoryForTitle) updateData.signatoryForTitle = signatoryForTitle;
      updateData.signedAt = new Date();
      updateData.issuedAt = new Date();
    }

    if (targetStatus === "ACKNOWLEDGED") {
      updateData.acknowledgedAt = new Date();
    }

    // 6. Execute database update
    const updatedLetter = await prisma.hrLetterDocument.update({
      where: { id },
      data: updateData,
      include: {
        staff: true,
        approvalWorkflows: { orderBy: { stepNumber: "asc" } },
      },
    });

    // 7. Manage approval workflow entries
    if (targetStatus === "PENDING_APPROVAL" && currentStatus !== "PENDING_APPROVAL") {
      await prisma.hrApprovalWorkflow.create({
        data: {
          letterId: id,
          stepNumber: (currentLetter.approvalWorkflows?.length || 0) + 1,
          approverRole: "HR_DIRECTOR",
          approverName: "Director HR",
          status: "PENDING",
          comments: comments || "Submitted for director review",
        },
      });
    } else if (targetStatus === "APPROVED" || targetStatus === "REJECTED") {
      const activeWorkflow = await prisma.hrApprovalWorkflow.findFirst({
        where: { letterId: id, status: "PENDING" },
        orderBy: { stepNumber: "desc" },
      });

      const decisionComments =
        rejectionReason || comments || (targetStatus === "APPROVED" ? "Approved by HR Director." : "Revision requested.");

      if (activeWorkflow) {
        await prisma.hrApprovalWorkflow.update({
          where: { id: activeWorkflow.id },
          data: {
            status: targetStatus === "APPROVED" ? "APPROVED" : "REJECTED",
            approverName: session.fullName,
            approverRole: session.role,
            comments: decisionComments,
            decidedAt: new Date(),
          },
        });
      } else {
        await prisma.hrApprovalWorkflow.create({
          data: {
            letterId: id,
            stepNumber: (currentLetter.approvalWorkflows?.length || 0) + 1,
            approverRole: session.role,
            approverName: session.fullName,
            status: targetStatus === "APPROVED" ? "APPROVED" : "REJECTED",
            comments: decisionComments,
            decidedAt: new Date(),
          },
        });
      }
    }

    // 8. Audit Log
    const actionName =
      action ||
      (targetStatus === "APPROVED"
        ? "LETTER_APPROVED"
        : targetStatus === "REJECTED"
        ? "LETTER_REJECTED"
        : targetStatus === "ISSUED"
        ? "LETTER_ISSUED_WITH_SIGNATURE"
        : targetStatus === "PENDING_APPROVAL"
        ? "LETTER_SUBMITTED"
        : targetStatus === "ACKNOWLEDGED"
        ? "LETTER_ACKNOWLEDGED"
        : "LETTER_UPDATED");

    const auditDetail =
      rejectionReason
        ? `Revision requested by ${session.fullName} (${session.role}). Reason: ${rejectionReason}`
        : targetStatus === "APPROVED"
        ? `Approved by ${session.fullName} (${session.role}). Note: ${comments || "Standard Approval"}`
        : targetStatus === "ISSUED"
        ? `Officially signed and issued by ${session.fullName} (${session.role}) with cryptographic digital signature.`
        : targetStatus === "PENDING_APPROVAL"
        ? `Submitted for director review by ${session.fullName} (${session.role})`
        : `Letter updated to ${targetStatus} by ${session.fullName} (${session.role})`;

    await prisma.hrLetterAuditLog.create({
      data: {
        action: actionName,
        actorName: session.fullName,
        actorRole: session.role,
        targetId: id,
        targetType: "HrLetterDocument",
        details: auditDetail,
      },
    });

    return NextResponse.json({ success: true, data: updatedLetter });
  } catch (error: any) {
    console.error("PUT /api/hrletters/letters/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
