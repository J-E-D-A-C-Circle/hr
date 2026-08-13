import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/staff/merge -> { primary_id: number, duplicate_id: number }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primary_id, duplicate_id } = body;

    if (!primary_id || !duplicate_id) {
      return NextResponse.json(
        { success: false, error: "primary_id and duplicate_id are required." },
        { status: 400 }
      );
    }

    const primaryId = parseInt(String(primary_id), 10);
    const duplicateId = parseInt(String(duplicate_id), 10);

    if (primaryId === duplicateId) {
      return NextResponse.json(
        { success: false, error: "Primary and duplicate record cannot be the same staff member." },
        { status: 400 }
      );
    }

    const primaryStaff = await (prisma as any).staff.findUnique({
      where: { id: primaryId },
      include: { contracts: true, validations: true },
    });

    const duplicateStaff = await (prisma as any).staff.findUnique({
      where: { id: duplicateId },
      include: { contracts: true, validations: true },
    });

    if (!primaryStaff || !duplicateStaff) {
      return NextResponse.json(
        { success: false, error: "One or both staff records were not found." },
        { status: 404 }
      );
    }

    // Merge empty fields from duplicate into primary
    const updateData: any = {};
    if (!primaryStaff.staff_code && duplicateStaff.staff_code) updateData.staff_code = duplicateStaff.staff_code;
    if (!primaryStaff.date_of_birth && duplicateStaff.date_of_birth) updateData.date_of_birth = duplicateStaff.date_of_birth;
    if (!primaryStaff.gender && duplicateStaff.gender) updateData.gender = duplicateStaff.gender;
    if (!primaryStaff.email && duplicateStaff.email) updateData.email = duplicateStaff.email;
    if (!primaryStaff.ssnit_no && duplicateStaff.ssnit_no) updateData.ssnit_no = duplicateStaff.ssnit_no;
    if (!primaryStaff.nia_number && duplicateStaff.nia_number) updateData.nia_number = duplicateStaff.nia_number;
    if (!primaryStaff.phone && duplicateStaff.phone) updateData.phone = duplicateStaff.phone;
    if (!primaryStaff.department && duplicateStaff.department) updateData.department = duplicateStaff.department;
    if (!primaryStaff.bank_name && duplicateStaff.bank_name) updateData.bank_name = duplicateStaff.bank_name;
    if (!primaryStaff.bank_branch && duplicateStaff.bank_branch) updateData.bank_branch = duplicateStaff.bank_branch;
    if (!primaryStaff.bank_account && duplicateStaff.bank_account) updateData.bank_account = duplicateStaff.bank_account;
    if (!primaryStaff.salary && duplicateStaff.salary) updateData.salary = duplicateStaff.salary;

    if (Object.keys(updateData).length > 0) {
      await (prisma as any).staff.update({
        where: { id: primaryId },
        data: updateData,
      });
    }

    // Transfer contracts from duplicate to primary
    await (prisma as any).contract.updateMany({
      where: { staff_id: duplicateId },
      data: { staff_id: primaryId, is_current: false },
    });

    // Transfer validations from duplicate to primary if not already validated
    if (duplicateStaff.validations && duplicateStaff.validations.length > 0) {
      for (const val of duplicateStaff.validations) {
        const exists = primaryStaff.validations?.some(
          (v: any) => v.month.toLowerCase() === val.month.toLowerCase()
        );
        if (!exists) {
          await (prisma as any).staffValidation.create({
            data: {
              staff_id: primaryId,
              month: val.month,
              validated_by: val.validated_by,
              notes: val.notes,
            },
          });
        }
      }
    }

    // Delete duplicate staff record
    await (prisma as any).staff.delete({
      where: { id: duplicateId },
    });

    const merged = await (prisma as any).staff.findUnique({
      where: { id: primaryId },
      include: {
        contracts: { orderBy: { created_at: "desc" } },
        validations: { orderBy: { validated_at: "desc" } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully merged staff record #${duplicateId} into #${primaryId}.`,
      data: merged,
    });
  } catch (error: any) {
    console.error("POST /api/staff/merge error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to merge staff records" },
      { status: 500 }
    );
  }
}
