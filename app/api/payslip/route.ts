import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildSinglePayslipWorkbook } from "@/lib/excel";
import { getCurrentMonthYearString } from "@/lib/status";
import { calculateGhanaDeductions } from "@/lib/payroll";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staff_id");
    const month = searchParams.get("month") || getCurrentMonthYearString();
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
    const ghanaCalc = calculateGhanaDeductions(basic);
    const ssnitTier1 = ghanaCalc.ssnit_employer_amount;
    const petraTier2 = ghanaCalc.petra_employee_amount;
    const ssnitEmployee = ghanaCalc.ssnit_employee_amount;
    const graPaye = ghanaCalc.paye_tax_amount;
    const totalDeductions = ghanaCalc.total_employee_deductions;
    const netPay = ghanaCalc.net_take_home_salary;

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
