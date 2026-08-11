import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateEndDate } from "@/lib/status";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid records provided for import." },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    const errors: string[] = [];

    // Process in transaction for atomic safety
    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < records.length; i++) {
        const item = records[i];

        try {
          const startDateObj = new Date(item.start_date);
          if (isNaN(startDateObj.getTime())) {
            errors.push(`Row ${i + 1}: Invalid start date "${item.start_date}"`);
            continue;
          }

          const endDateObj = item.end_date ? new Date(item.end_date) : calculateEndDate(startDateObj);

          await tx.staff.create({
            data: {
              staff_code: item.staff_code || null,
              full_name: item.full_name,
              role: item.role || null,
              department: item.department || null,
              phone: item.phone || null,
              bank_name: item.bank_name || null,
              bank_account: item.bank_account || null,
              salary: item.salary ? parseFloat(item.salary) : null,
              insurance_provider: item.insurance_provider || "Petra",
              insurance_policy_no: item.insurance_policy_no || null,
              insurance_premium: item.insurance_premium ? parseFloat(item.insurance_premium) : null,
              contracts: {
                create: {
                  start_date: startDateObj,
                  end_date: endDateObj,
                  renewal_number: 1,
                  is_current: true,
                },
              },
            },
          });
          insertedCount++;
        } catch (rowErr: any) {
          errors.push(`Row ${i + 1} (${item.full_name || "Unknown"}): ${rowErr.message}`);
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Import completed! Successfully imported ${insertedCount} staff records.`,
      insertedCount,
      errors,
    });
  } catch (error: any) {
    console.error("POST /api/import error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute Excel import." },
      { status: 500 }
    );
  }
}
