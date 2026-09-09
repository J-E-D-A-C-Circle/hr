import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeContractStatus, getCurrentMonthYearString } from "@/lib/status";
import { buildExportWorkbook, buildPayrollPaymentWorkbook, buildSsnitContributionWorkbook, buildMonthlyComputationWorkbook, buildPetraTier2Workbook } from "@/lib/excel";
import { calculateGhanaDeductions } from "@/lib/payroll";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "currently_employed"; // default Active + Expiring Soon
    const department = searchParams.get("department") || "";
    const format = searchParams.get("format") || "excel";
    const exportType = searchParams.get("export_type") || "payroll"; // "payroll", "ssnit", "computation", "standard"
    const validationMonth = searchParams.get("validation_month") || "";

    const whereClause: any = {};
    if (department) {
      whereClause.department = department;
    }

    const staffList = await prisma.staff.findMany({
      where: whereClause,
      include: {
        contracts: {
          orderBy: {
            created_at: "desc",
          },
        },
        validations: {
          orderBy: {
            validated_at: "desc",
          },
        },
      },
      orderBy: {
        full_name: "asc",
      },
    });

    // Annotate and filter
    const annotated = staffList.map((item: any) => {
      const currentContract = item.contracts.find((c: any) => c.is_current) || item.contracts[0] || null;
      const status = computeContractStatus(currentContract);
      return {
        ...item,
        currentContract,
        computedStatus: status,
      };
    });

    const filtered = annotated.filter((item: any) => {
      // Month Validation Filter
      if (validationMonth) {
        const cleanMonth = validationMonth.replace(/\s*\([^)]*\)/g, "").trim().toLowerCase();
        if (cleanMonth) {
          const hasValidation = item.validations?.some(
            (v: any) => v.month.toLowerCase().includes(cleanMonth) || cleanMonth.includes(v.month.toLowerCase())
          );
          if (!hasValidation) return false;
        }
      }

      // Standard Full Data Directory Export includes ALL employees across all status categories

      if (filter === "currently_employed") {
        // Active + Expiring Soon
        return item.computedStatus === "Active" || item.computedStatus === "Expiring Soon";
      } else if (filter === "active") {
        return item.computedStatus === "Active";
      } else if (filter === "expiring") {
        return item.computedStatus === "Expiring Soon";
      } else if (filter === "expired") {
        return item.computedStatus === "Expired";
      } else if (filter === "terminated") {
        return item.computedStatus === "Terminated";
      }
      return true; // "all"
    });

    if (format === "json") {
      let sumGross = 0;
      let sumNssf13 = 0;
      let sumPayCost = 0;
      let sumNetPay = 0;

      filtered.forEach((item: any) => {
        const basic = item.salary ? Number(item.salary) : 1400.00;
        const ghanaCalc = calculateGhanaDeductions(basic);
        const totalGross = basic * 1;
        const nssf55 = ghanaCalc.ssnit_employee_amount;
        const nssf13 = ghanaCalc.ssnit_employer_amount;
        const payCost = Math.round((totalGross + nssf13) * 100) / 100;
        const incomeTax = ghanaCalc.paye_tax_amount;
        const totalDeduction = ghanaCalc.total_employee_deductions;
        const netPay = ghanaCalc.net_take_home_salary;

        sumGross += totalGross;
        sumNssf13 += nssf13;
        sumPayCost += payCost;
        sumNetPay += netPay;
      });

      const additions = filtered.filter((item: any) => {
        const joining = item.contracts?.[0]?.start_date || item.created_at;
        if (!joining) return false;
        const d = new Date(joining);
        return d.getMonth() === 7 && d.getFullYear() === 2026;
      }).length;

      const renewals = filtered.filter((item: any) => {
        return item.contracts?.some((c: any) => c.renewal_number > 1);
      }).length;

      const expiredTerminated = filtered.filter((item: any) => {
        return item.computedStatus === "Expired" || item.computedStatus === "Terminated";
      }).length;

      const validationOnHold = filtered.filter((item: any) => {
        return item.payment_status === "unpaid" || item.payment_status === "hold";
      }).length;

      const juneSupplementary = filtered.filter((item: any) => {
        return (item.unpaid_reason || "").toLowerCase().includes("supplementary");
      }).length;

      const totalAttrition = expiredTerminated + validationOnHold;
      const currentTotal = filtered.length;
      const basePrevMonth = Math.max(0, currentTotal - additions - juneSupplementary + totalAttrition);
      const totalBase = basePrevMonth + juneSupplementary;

      const summaryOverview = {
        totalValidatedStaff: currentTotal,
        totalMonthlyGrossPayroll: sumGross,
        totalEmployerNSSF13: sumNssf13,
        totalEmployerCostOfEmployment: sumPayCost,
        totalNetPayout: sumNetPay,
      };

      const reconciliation = {
        basePrevMonth,
        juneSupplementary,
        totalBase,
        additions,
        renewals,
        expiredTerminated,
        validationOnHold,
        totalAttrition,
        currentTotal,
      };

      return NextResponse.json({
        success: true,
        count: filtered.length,
        data: filtered,
        summaryOverview,
        reconciliation,
      });
    }

    // Generate Excel Buffer based on export_type
    let excelBuffer: Buffer;
    let filename: string;
    const dateStr = new Date().toISOString().split("T")[0];

    if (exportType === "expiring" || filter === "expiring") {
      const expiringList = annotated.filter((item: any) => item.computedStatus === "Expiring Soon");
      excelBuffer = await buildExportWorkbook(expiringList, "Expiring Soon Staff");
      filename = `Expiring_Soon_Staff_Directory_${dateStr}.xlsx`;
    } else if (exportType === "petra") {
      const mStr = validationMonth || getCurrentMonthYearString();
      excelBuffer = await buildPetraTier2Workbook(filtered, mStr);
      filename = `PETRA_${mStr ? mStr.replace(/[^a-zA-Z0-9]/g, "_") : "Monthly_Schedules"}_${dateStr}.xlsx`;
    } else if (exportType === "payroll") {
      const mStr = validationMonth || getCurrentMonthYearString();
      excelBuffer = await buildPayrollPaymentWorkbook(filtered, mStr);
      filename = `Payroll_Payment_${mStr.replace(/[^a-zA-Z0-9]/g, "_")}_${dateStr}.xlsx`;
    } else if (exportType === "ssnit") {
      const mStr = validationMonth || getCurrentMonthYearString();
      excelBuffer = await buildSsnitContributionWorkbook(filtered, mStr);
      filename = `SSNIT_Contribution_${mStr.replace(/[^a-zA-Z0-9]/g, "_")}_${dateStr}.xlsx`;
    } else if (exportType === "computation") {
      const mStr = validationMonth || getCurrentMonthYearString();
      excelBuffer = await buildMonthlyComputationWorkbook(filtered, mStr);
      filename = `Monthly_Computation_${mStr.replace(/[^a-zA-Z0-9]/g, "_")}_${dateStr}.xlsx`;
    } else {
      const exportList = (exportType === "standard" && (filter === "all" || !filter)) ? annotated : filtered;
      excelBuffer = await buildExportWorkbook(exportList);
      filename = `Standard_Full_Staff_Directory_${dateStr}.xlsx`;
    }

    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate export file" },
      { status: 500 }
    );
  }
}
