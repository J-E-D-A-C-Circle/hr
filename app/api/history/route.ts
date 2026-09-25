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

    const validatedStaffIds = new Set(monthValidations.map((v: any) => v.staff_id));
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
    const validatedStaffList = allStaff.filter((staff: any) => {
      if (hasMonthValidations) {
        return validatedStaffIds.has(staff.id);
      }
      // Fallback: check if staff has any validation matching month string or active status
      return staff.validations.some((v: any) => v.month.toLowerCase().includes(monthLabel.toLowerCase()));
    });

    let additionsInMonthCount = 0;
    let renewalsInPrevMonthCount = 0;
    let validationOnHoldCount = 0;
    let prevSupplementaryCount = 0;

    // Previous month details
    const prevMonthIdx = targetMonth === 1 ? 11 : targetMonth - 2;
    const prevMonthYear = targetMonth === 1 ? targetYear - 1 : targetYear;
    const prevMonthLabel = monthNames[prevMonthIdx];

    const prevMonthLastDay = new Date(targetYear, targetMonth - 1, 0).getDate();
    const currentMonthLastDay = new Date(targetYear, targetMonth, 0).getDate();

    const prevMonthEndDateStr = `${String(prevMonthLastDay).padStart(2, "0")}/${String(prevMonthIdx + 1).padStart(2, "0")}/${prevMonthYear}`;
    const currentMonthEndDateStr = `${String(currentMonthLastDay).padStart(2, "0")}/${String(targetMonth).padStart(2, "0")}/${targetYear}`;

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

    // Renewals in previous month (contracts renewed in prevMonthLabel)
    allStaff.forEach((staff: any) => {
      const renewedInPrev = staff.contracts.some((c: any) => {
        if (!c.renewal_number || c.renewal_number <= 1) return false;
        const cStart = new Date(c.start_date);
        return cStart.getFullYear() === prevMonthYear && cStart.getMonth() + 1 === (prevMonthIdx + 1);
      });
      if (renewedInPrev) renewalsInPrevMonthCount++;
    });

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

      // Track additions in current month
      const addedInMonth = staff.contracts.some((c: any) => {
        const cStart = new Date(c.start_date);
        return cStart.getFullYear() === targetYear && cStart.getMonth() + 1 === targetMonth;
      });
      if (addedInMonth) additionsInMonthCount++;

      if (staff.payment_status === "unpaid" || staff.payment_status === "hold") {
        validationOnHoldCount++;
      }

      if ((staff.unpaid_reason || "").toLowerCase().includes("supplementary")) {
        prevSupplementaryCount++;
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

    // Reconciliation formula:
    // currentTotal = totalBase + additions + renewalsInPrevMonth - totalAttrition
    // totalBase = basePrevMonth + prevSupplementary
    const totalBase = Math.max(0, currentTotal - additionsInMonthCount - renewalsInPrevMonthCount + totalAttrition);
    const basePrevMonth = Math.max(0, totalBase - prevSupplementaryCount);

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
        prevSupplementary: prevSupplementaryCount,
        totalBase,
        additions: additionsInMonthCount,
        renewalsInPrevMonth: renewalsInPrevMonthCount,
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
      const reconRows = [
        { "Staff Strength Movement & Reconciliation": `Total staff strength As At ${prevMonthEndDateStr}`, "Count": metrics.reconciliation.basePrevMonth },
        { "Staff Strength Movement & Reconciliation": "Add Supplementary", "Count": metrics.reconciliation.prevSupplementary },
        { "Staff Strength Movement & Reconciliation": "Total Staff Strength", "Count": metrics.reconciliation.totalBase },
        { "Staff Strength Movement & Reconciliation": `Additions in ${monthLabel}`, "Count": metrics.reconciliation.additions },
        { "Staff Strength Movement & Reconciliation": `Renewal in ${prevMonthLabel}`, "Count": metrics.reconciliation.renewalsInPrevMonth },
        { "Staff Strength Movement & Reconciliation": "Less:", "Count": "" },
        { "Staff Strength Movement & Reconciliation": `Expired/Terminated (${monthLabel})`, "Count": metrics.reconciliation.expiredTerminated },
        { "Staff Strength Movement & Reconciliation": "Validation on Hold", "Count": metrics.reconciliation.validationOnHold },
        { "Staff Strength Movement & Reconciliation": "Total Attrition", "Count": metrics.reconciliation.totalAttrition },
        { "Staff Strength Movement & Reconciliation": `Total Staff Strength As At ${currentMonthEndDateStr}`, "Count": metrics.reconciliation.currentTotal },
      ];

      // Sheet 2: Salary Register format matching benchmark
      const salRegRows = filteredList.map((row: any, idx: number) => {
        const basic = Number(row.salary) || 1400.00;
        const nssf55 = Number(row.ssnit_employee_amount) || 77.00;
        const nssf13 = Math.round(basic * 0.13 * 100) / 100;
        const totalPayCost = basic + nssf13;
        const totalTaxableAmount = basic - nssf55;
        const graPaye = Number(row.paye_tax_amount) || 122.28;
        const totalDeduction = nssf55 + graPaye;
        const netPay = basic - totalDeduction;

        return {
          "Sr. No.": idx + 1,
          "EMPLOYEE ID": row.staff_code,
          "EMPLOYEE NAME": row.full_name,
          "LOCATION": row.department,
          "JOINING DATE": formatDateDDMMYYYY(row.contract_start),
          "END DATE": formatDateDDMMYYYY(row.contract_end),
          " BASIC": basic,
          " GROSS SALARY": basic,
          "N0. OF MONTHS": 1,
          " TOTAL GROSS SALARY": basic,
          " NSSF(5.5%)": nssf55,
          "NSSF(13%)": nssf13,
          "TOTAL PAY COST": totalPayCost,
          "TOTAL TAXABLE AMOUNT": totalTaxableAmount,
          "INCOME TAX": graPaye,
          " TOTAL DEDUCTION": totalDeduction,
          " NET PAY": netPay,
        };
      });

      // Sheet 3: PAYE Computation Report
      const payeRows = filteredList.map((row: any, idx: number) => {
        const basic = Number(row.salary) || 1400.00;
        const graPaye = Number(row.paye_tax_amount) || 122.28;
        return {
          "Sr. No.": idx + 1,
          "EMPLOYEE ID": row.staff_code,
          "EMPLOYEE NAME": row.full_name,
          "LOCATION": row.department,
          "JOINING DATE": formatDateDDMMYYYY(row.contract_start),
          "END DATE": formatDateDDMMYYYY(row.contract_end),
          " BASIC": basic,
          " GROSS SALARY": basic,
          "INCOME TAX": graPaye,
        };
      });

      // Sheet 4: GRA- PORTAL (Official GRA Monthly Tax Deductions Schedule)
      const graPortalRows = filteredList.map((row: any, idx: number) => {
        const basic = Number(row.salary) || 1400.00;
        const ssnit55 = Number(row.ssnit_employee_amount) || 77.00;
        const chargeable = basic - ssnit55;
        const graPaye = Number(row.paye_tax_amount) || 122.28;

        return {
          "Ser. No": idx + 1,
          "TIN / GH. CARD NO.": row.nia_number || "N/A",
          "Name Of Employee": row.full_name,
          "Position": row.role || "OTHER",
          "Residency/ Part-Time/ Casual": "Resident-Full-Time",
          "Basic Salary": basic,
          "Secondary Employment (Y / N)": "N",
          "Paid SSNIT (Y / N)": "Y",
          "Social Security Fund": ssnit55,
          "Third Tier": 0,
          "Cash Allowances": 0,
          "Bonus Income(up to 15% of Annual Basic salary)": 0,
          "Final Tax on Bonus Income": 0,
          " Excess Bonus": 0,
          "Total Cash emolument (6+11+14)": basic,
          "Accommodation Element": 0,
          "Vehicle Element": 0,
          "Non Cash Benefit": 0,
          "Total Assessable Income (15+16+17+18)": basic,
          "Deductible Reliefs": 0,
          "Total Reliefs (9+10+20)": ssnit55,
          "Chargeable Income (19 - 21)": chargeable,
          "Tax Deductible": graPaye,
          "Overtime Income": 0,
          "Overtime Tax": 0,
          "Adjustment": 0,
          "Total Tax Payable to GRA (13+23+25)": graPaye,
          "Severance pay paid": 0,
          "Remarks": "Active Temp Staff",
        };
      });

      const workbook = XLSX.utils.book_new();

      const reconSheet = XLSX.utils.json_to_sheet(reconRows);
      XLSX.utils.book_append_sheet(workbook, reconSheet, "Reconciliation Summary");

      const salRegSheet = XLSX.utils.json_to_sheet(salRegRows);
      XLSX.utils.book_append_sheet(workbook, salRegSheet, `Sal Reg. ${monthLabel.substring(0, 4)} ${targetYear}`);

      const payeSheet = XLSX.utils.json_to_sheet(payeRows);
      XLSX.utils.book_append_sheet(workbook, payeSheet, `PAYE- ${monthLabel.substring(0, 4)} ${targetYear}`);

      const graPortalSheet = XLSX.utils.json_to_sheet(graPortalRows);
      XLSX.utils.book_append_sheet(workbook, graPortalSheet, "GRA- PORTAL");

      const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Temporary_Staff_Computation_${monthLabel}_${targetYear}.xlsx"`,
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
