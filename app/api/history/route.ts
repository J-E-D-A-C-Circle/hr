import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateGhanaDeductions } from "@/lib/payroll";
import { formatDateDDMMYYYY } from "@/lib/status";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const searchQuery = searchParams.get("search") || "";
    const format = searchParams.get("format") || "json";

    const targetYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    const targetMonth = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1; // 1-indexed

    const targetStart = new Date(targetYear, targetMonth - 1, 1);
    const targetEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthLabel = monthNames[targetMonth - 1] || `Month ${targetMonth}`;
    const targetMonthStr = `${monthLabel} ${targetYear}`;

    // Fetch validations for target month
    const monthValidations = await prisma.staffValidation.findMany({
      where: {
        month: {
          contains: targetMonthStr,
        },
      },
      select: {
        staff_id: true,
      },
    });

    const validatedStaffIds = new Set(monthValidations.map((v) => v.staff_id));
    const hasMonthValidations = validatedStaffIds.size > 0;

    // Fetch all staff with their contracts and validations
    const allStaff = await prisma.staff.findMany({
      include: {
        contracts: {
          orderBy: { start_date: "asc" },
        },
        validations: {
          orderBy: { validated_at: "desc" },
        },
      },
      orderBy: { full_name: "asc" },
    });

    // Filter staff strictly validated for target month (if validations exist)
    const validatedStaffList = allStaff.filter((staff) => {
      if (hasMonthValidations) {
        return validatedStaffIds.has(staff.id);
      }
      // Fallback: check if staff has any validation matching month string or active status
      return staff.validations.some((v) => v.month.toLowerCase().includes(monthLabel.toLowerCase()));
    });

    let additionsInMonthCount = 0;
    let renewalsInMonthCount = 0;
    let validationOnHoldCount = 0;
    let juneSupplementaryCount = 0;

    // Expirations/Terminations across ALL staff records in DB for target month
    const expiredInMonthCount = allStaff.filter((staff: any) => {
      return staff.contracts.some((c: any) => {
        if (c.is_terminated) {
          if (!c.termination_date) return true;
          const tDate = new Date(c.termination_date);
          return tDate.getFullYear() === targetYear && tDate.getMonth() + 1 === targetMonth;
        }
        const cEnd = new Date(c.end_date);
        return cEnd.getFullYear() === targetYear && cEnd.getMonth() + 1 === targetMonth;
      });
    }).length;

    const periodStaffList: any[] = [];
    let totalGrossSalary = 0;
    let totalSsnitPool = 0;
    let totalEmployerNSSF13 = 0;
    let totalCostOfEmployment = 0;
    let totalNetSalary = 0;
    let paidCount = 0;

    validatedStaffList.forEach((staff: any) => {
      const activeContractInMonth = staff.contracts.find((c: any) => {
        const cStart = new Date(c.start_date);
        const cEnd = new Date(c.end_date);
        const wasTerminated = c.is_terminated && c.termination_date && new Date(c.termination_date) < targetStart;
        if (wasTerminated) return false;
        return cStart <= targetEnd && cEnd >= targetStart;
      }) || staff.contracts[0] || null;

      // Track additions in month
      const addedInMonth = staff.contracts.some((c: any) => {
        const cStart = new Date(c.start_date);
        return cStart.getFullYear() === targetYear && cStart.getMonth() + 1 === targetMonth;
      });
      if (addedInMonth) additionsInMonthCount++;

      // Track renewals in month
      const renewedInMonth = staff.contracts.some((c: any) => c.renewal_number > 1);
      if (renewedInMonth) renewalsInMonthCount++;

      if (staff.payment_status === "unpaid" || staff.payment_status === "hold") {
        validationOnHoldCount++;
      }

      if ((staff.unpaid_reason || "").toLowerCase().includes("supplementary")) {
        juneSupplementaryCount++;
      }

      const isPaid = (staff.payment_status || "paid") === "paid";
      const salary = staff.salary ? Number(staff.salary) : 1400.00;
      const deductions = calculateGhanaDeductions(salary, isPaid);
      const nssf13 = Math.round(salary * 0.13 * 100) / 100;
      const payCost = Math.round((salary + nssf13) * 100) / 100;

      paidCount++;
      totalGrossSalary += salary;
      totalEmployerNSSF13 += nssf13;
      totalCostOfEmployment += payCost;
      totalSsnitPool += deductions.ssnit_employee_amount + deductions.ssnit_employer_amount;
      totalNetSalary += deductions.net_take_home_salary;

      periodStaffList.push({
        id: staff.id,
        staff_code: staff.staff_code || `EMP-${staff.id}`,
        full_name: staff.full_name,
        ssnit_no: staff.ssnit_no || null,
        department: staff.department || "General Office",
        role: staff.role || "Temporary Staff",
        salary,
        payment_status: staff.payment_status || "paid",
        unpaid_reason: staff.unpaid_reason || null,
        contract_start: activeContractInMonth?.start_date || new Date(),
        contract_end: activeContractInMonth?.end_date || new Date(),
        renewal_number: activeContractInMonth?.renewal_number || 1,
        ssnit_employee_amount: deductions.ssnit_employee_amount,
        paye_tax_amount: deductions.paye_tax_amount,
        total_employee_deductions: deductions.total_employee_deductions,
        net_take_home_salary: deductions.net_take_home_salary,
      });
    });

    // Filter by search query if provided
    let filteredList = periodStaffList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredList = filteredList.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(q) ||
          s.staff_code?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q) ||
          (s.ssnit_no && s.ssnit_no.toLowerCase().includes(q))
      );
    }

    const totalAttrition = expiredInMonthCount + validationOnHoldCount;
    const currentTotal = periodStaffList.length;
    const basePrevMonth = Math.max(0, currentTotal - additionsInMonthCount - juneSupplementaryCount + totalAttrition);
    const totalBase = basePrevMonth + juneSupplementaryCount;

    // Helper for date formatting DD/MM/YYYY
    const prevMonthIdx = targetMonth === 1 ? 11 : targetMonth - 2;
    const prevMonthYear = targetMonth === 1 ? targetYear - 1 : targetYear;
    const prevMonthLabel = monthNames[prevMonthIdx];

    const prevMonthLastDay = new Date(targetYear, targetMonth - 1, 0).getDate();
    const currentMonthLastDay = new Date(targetYear, targetMonth, 0).getDate();

    const prevMonthEndDateStr = `${String(prevMonthLastDay).padStart(2, "0")}/${String(prevMonthIdx + 1).padStart(2, "0")}/${prevMonthYear}`;
    const currentMonthEndDateStr = `${String(currentMonthLastDay).padStart(2, "0")}/${String(targetMonth).padStart(2, "0")}/${targetYear}`;

    const metrics = {
      targetYear,
      targetMonth,
      monthLabel,
      totalValidatedStaffStrength: currentTotal,
      totalStaffStrength: currentTotal,
      filteredCount: filteredList.length,
      additionsInMonth: additionsInMonthCount,
      expiredInMonth: expiredInMonthCount,
      paidCount,
      totalGrossSalary,
      totalEmployerNSSF13,
      totalCostOfEmployment,
      totalSsnitPool,
      totalNetSalary,
      reconciliation: {
        basePrevMonth,
        juneSupplementary: juneSupplementaryCount,
        totalBase,
        additions: additionsInMonthCount,
        renewals: renewalsInMonthCount,
        expiredTerminated: expiredInMonthCount,
        validationOnHold: validationOnHoldCount,
        totalAttrition,
        currentTotal,
        prevMonthLabel,
        prevMonthEndDateStr,
        currentMonthEndDateStr,
      },
    };

    if (format === "excel") {
      const exportRows = filteredList.map((row: any, idx: number) => ({
        "Sr. No.": idx + 1,
        "Staff Code": row.staff_code,
        "Employee Name": row.full_name,
        "SSNIT Number": row.ssnit_no || "N/A",
        "Station / Location": row.department,
        "Role": row.role,
        "Contract Start": formatDateDDMMYYYY(row.contract_start),
        "Contract End": formatDateDDMMYYYY(row.contract_end),
        "Renewal #": `#${row.renewal_number}`,
        "Basic Salary (GH₵)": row.salary.toFixed(2),
        "SSNIT Emp 5.5% (GH₵)": row.ssnit_employee_amount.toFixed(2),
        "GRA PAYE Tax (GH₵)": row.paye_tax_amount.toFixed(2),
        "Total Deductions (GH₵)": row.total_employee_deductions.toFixed(2),
        "Net Take-Home Pay (GH₵)": row.net_take_home_salary.toFixed(2),
        "Payout Status": row.payment_status.toUpperCase(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${monthLabel} ${targetYear} Staff`);

      const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="History_Analytics_${monthLabel}_${targetYear}.xlsx"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      metrics,
      data: filteredList,
    });
  } catch (error: any) {
    console.error("GET /api/history error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load historical analytics." },
      { status: 500 }
    );
  }
}
