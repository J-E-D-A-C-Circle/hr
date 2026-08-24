import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildSinglePayslipWorkbook } from "@/lib/excel";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staff_id");
    const month = searchParams.get("month") || "August 2026";
    const format = searchParams.get("format") || "excel"; // "excel" or "json"

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required to generate payslip" },
        { status: 400 }
      );
    }

    const staffRecord = await prisma.staff.findUnique({
      where: { id: Number(staffId) },
      include: {
        contracts: {
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!staffRecord) {
      return NextResponse.json(
        { success: false, error: "Staff record not found" },
        { status: 404 }
      );
    }

    const basic = staffRecord.salary ? Number(staffRecord.salary) : 1400.0;
    const ssnitTier1 = Math.round(basic * 0.135 * 100) / 100;
    const petraTier2 = Math.round(basic * 0.05 * 100) / 100;
    const ssnitEmployee = Math.round(basic * 0.055 * 100) / 100;
    const graPaye = 122.28;
    const totalDeductions = Math.round((ssnitEmployee + graPaye) * 100) / 100;
    const netPay = Math.round((basic - totalDeductions) * 100) / 100;

    const payslipData = {
      staff: staffRecord,
      month,
      financials: {
        basicSalary: basic,
        allowances: 0.0,
        grossSalary: basic,
        ssnitEmployee,
        ssnitEmployer: ssnitTier1,
        petraTier2,
        graPaye,
        totalDeductions,
        netPay,
      },
    };

    if (format === "json") {
      return NextResponse.json({ success: true, data: payslipData });
    }

    const excelBuffer = await buildSinglePayslipWorkbook(staffRecord, month);
    const safeCode = (staffRecord.staff_code || `EMP-${staffRecord.id}`).replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Payslip_${safeCode}_${month.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;

    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/payslip error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate payslip" },
      { status: 500 }
    );
  }
}
