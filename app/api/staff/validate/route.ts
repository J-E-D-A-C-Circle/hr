import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/staff/validate?month=August 2026&staff_id=12
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const staffIdParam = searchParams.get("staff_id");

    const where: any = {};
    if (month) where.month = month;
    if (staffIdParam) where.staff_id = parseInt(staffIdParam, 10);

    const validations = await prisma.staffValidation.findMany({
      where,
      include: {
        staff: true,
      },
      orderBy: { validated_at: "desc" },
    });

    return NextResponse.json({ success: true, data: validations });
  } catch (error: any) {
    console.error("GET /api/staff/validate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch staff validations" },
      { status: 500 }
    );
  }
}

// POST /api/staff/validate -> { staff_id, month, notes, validated_by }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staff_id, month, notes, validated_by } = body;

    if (!staff_id || !month) {
      return NextResponse.json(
        { success: false, error: "staff_id and month are required." },
        { status: 400 }
      );
    }

    const staffId = parseInt(String(staff_id), 10);

    // Upsert validation
    const validation = await prisma.staffValidation.upsert({
      where: {
        staff_id_month: {
          staff_id: staffId,
          month: String(month).trim(),
        },
      },
      update: {
        validated_at: new Date(),
        validated_by: validated_by || "Admin",
        notes: notes || null,
      },
      create: {
        staff_id: staffId,
        month: String(month).trim(),
        validated_by: validated_by || "Admin",
        notes: notes || null,
      },
      include: {
        staff: true,
      },
    });

    return NextResponse.json({ success: true, data: validation });
  } catch (error: any) {
    console.error("POST /api/staff/validate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate staff member" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/validate -> { staff_id, month }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { staff_id, month } = body;

    if (!staff_id || !month) {
      return NextResponse.json(
        { success: false, error: "staff_id and month are required." },
        { status: 400 }
      );
    }

    const staffId = parseInt(String(staff_id), 10);

    await prisma.staffValidation.deleteMany({
      where: {
        staff_id: staffId,
        month: String(month).trim(),
      },
    });

    return NextResponse.json({ success: true, message: "Staff validation removed." });
  } catch (error: any) {
    console.error("DELETE /api/staff/validate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to unvalidate staff member" },
      { status: 500 }
    );
  }
}
