import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staffId = parseInt(id, 10);
    if (isNaN(staffId)) {
      return NextResponse.json({ success: false, error: "Invalid staff ID" }, { status: 400 });
    }

    const body = await request.json();
    const { termination_date, termination_reason } = body;

    if (!termination_date || !termination_reason) {
      return NextResponse.json(
        { success: false, error: "Termination date and reason are required." },
        { status: 400 }
      );
    }

    const currentContract = await prisma.contract.findFirst({
      where: {
        staff_id: staffId,
        is_current: true,
      },
    });

    if (!currentContract) {
      return NextResponse.json(
        { success: false, error: "No current contract found for staff member." },
        { status: 404 }
      );
    }

    const updatedContract = await prisma.contract.update({
      where: { id: currentContract.id },
      data: {
        is_terminated: true,
        termination_date: new Date(termination_date),
        termination_reason: termination_reason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contract terminated successfully.",
      data: updatedContract,
    });
  } catch (error: any) {
    console.error("POST /api/staff/[id]/terminate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to terminate contract" },
      { status: 500 }
    );
  }
}
