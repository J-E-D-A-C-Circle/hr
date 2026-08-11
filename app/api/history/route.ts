import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateGhanaDeductions } from "@/lib/payroll";
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

    // Fetch all staff with their contracts
    const allStaff = await prisma.staff.findMany({
      include: {
        contracts: {
          orderBy: { start_date: "asc" },
        },
      },
      orderBy: { full_name: "asc" },
    });

    let additionsInMonthCount = 0;
    let expiredInMonthCount = 0;

    const periodStaffList: any[] = [];
    let totalGrossSalary = 0;
    let totalSsnitPool = 0;
    let totalNetSalary = 0;
    let paidCount = 0;

    allStaff.forEach((staff: any) => {
      // Find contract active during target month
      const activeContractInMonth = staff.contracts.find((c: any) => {
        const cStart = new Date(c.start_date);
        const cEnd = new Date(c.end_date);

        const wasTerminated = c.is_terminated && c.termination_date && new Date(c.termination_date) < targetStart;
        if (wasTerminated) return false;

        return cStart <= targetEnd && cEnd >= targetStart;
      });

      // Track additions in month
      const addedInMonth = staff.contracts.some((c: any) => {
        const cStart = new Date(c.start_date);
        return cStart.getFullYear() === targetYear && cStart.getMonth() + 1 === targetMonth;
      });
      if (addedInMonth) additionsInMonthCount++;

      // Track expirations in month
      const expiredInMonth = staff.contracts.some((c: any) => {
        const cEnd = new Date(c.end_date);
        return cEnd.getFullYear() === targetYear && cEnd.getMonth() + 1 === targetMonth;
      });
      if (expiredInMonth) expiredInMonthCount++;

      if (activeContractInMonth) {
        const isPaid = (staff.payment_status || "paid") === "paid";
        const salary = staff.salary ? Number(staff.salary) : 0;
        const deductions = calculateGhanaDeductions(salary, isPaid);

        if (isPaid) {
          paidCount++;
          totalGrossSalary += salary;
          totalSsnitPool += deductions.ssnit_employee_amount + deductions.ssnit_employer_amount;
          totalNetSalary += deductions.net_take_home_salary;
        }

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
          contract_start: activeContractInMonth.start_date,
          contract_end: activeContractInMonth.end_date,
          renewal_number: activeContractInMonth.renewal_number,
          ssnit_employee_amount: deductions.ssnit_employee_amount,
          paye_tax_amount: deductions.paye_tax_amount,
          total_employee_deductions: deductions.total_employee_deductions,
          net_take_home_salary: deductions.net_take_home_salary,
        });
      }
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

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthLabel = monthNames[targetMonth - 1] || `Month ${targetMonth}`;

    const metrics = {
      targetYear,
      targetMonth,
      monthLabel,
      totalStaffStrength: periodStaffList.length,
      filteredCount: filteredList.length,
      additionsInMonth: additionsInMonthCount,
      expiredInMonth: expiredInMonthCount,
      paidCount,
      totalGrossSalary,
      totalSsnitPool,
      totalNetSalary,
    };

    if (format === "excel") {
      const exportRows = filteredList.map((row: any, idx: number) => ({
        "Sr. No.": idx + 1,
        "Staff Code": row.staff_code,
        "Employee Name": row.full_name,
        "SSNIT Number": row.ssnit_no || "N/A",
        "Station / Location": row.department,
        "Role": row.role,
        "Contract Start": new Date(row.contract_start).toISOString().split("T")[0],
        "Contract End": new Date(row.contract_end).toISOString().split("T")[0],
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
