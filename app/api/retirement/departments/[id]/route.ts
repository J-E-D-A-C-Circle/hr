import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const unitId = Number(id);
    const body = await request.json();
    const { code, name, type, location, headOfDept, description } = body;

    const existing = await prisma.retirementDepartment.findUnique({
      where: { id: unitId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Department or Station not found" },
        { status: 404 }
      );
    }

    if (code && code.trim().toUpperCase() !== existing.code) {
      const codeCheck = await prisma.retirementDepartment.findUnique({
        where: { code: code.trim().toUpperCase() },
      });
      if (codeCheck) {
        return NextResponse.json(
          { success: false, error: `Unit code '${code.trim().toUpperCase()}' is already used by another unit.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.retirementDepartment.update({
      where: { id: unitId },
      data: {
        code: code ? code.trim().toUpperCase() : existing.code,
        name: name ? name.trim() : existing.name,
        type: type || existing.type,
        location: location !== undefined ? location.trim() : existing.location,
        headOfDept: headOfDept !== undefined ? headOfDept.trim() : existing.headOfDept,
        description: description !== undefined ? description.trim() : existing.description,
      },
    });

    // Audit Log
    try {
      await prisma.retirementAuditLog.create({
        data: {
          userName: "HR Administrator",
          userRole: "HR_ADMINISTRATOR",
          action: "UPDATE_UNIT",
          details: `Updated ${updated.type} '${updated.name}' (${updated.code})`,
        },
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({ success: true, unit: updated });
  } catch (error: any) {
    console.error("PUT /api/retirement/departments/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update department/station" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const unitId = Number(id);

    const existing = await prisma.retirementDepartment.findUnique({
      where: { id: unitId },
      include: { staff: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Department or Station not found" },
        { status: 404 }
      );
    }

    if (existing.staff && existing.staff.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete '${existing.name}' because ${existing.staff.length} staff member(s) are assigned to it. Please reassign staff first.`,
        },
        { status: 400 }
      );
    }

    await prisma.retirementDepartment.delete({
      where: { id: unitId },
    });

    // Audit Log
    try {
      await prisma.retirementAuditLog.create({
        data: {
          userName: "HR Administrator",
          userRole: "HR_ADMINISTRATOR",
          action: "DELETE_UNIT",
          details: `Deleted ${existing.type} '${existing.name}' (${existing.code})`,
        },
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/retirement/departments/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete department/station" },
      { status: 500 }
    );
  }
}
