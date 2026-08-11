import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeContractStatus } from "@/lib/status";
import { calculateGhanaDeductions } from "@/lib/payroll";
import * as XLSX from "xlsx";

const DEFAULT_RATES = {
  ssnit_employee_rate: 5.5,
  ssnit_employer_rate: 13.0,
  petra_employee_rate: 5.0,
  petra_employer_rate: 5.0,
};

function parseName(fullName: string) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", surname: "", otherName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], surname: "", otherName: "" };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], surname: parts[1], otherName: "" };
  }
  return {
    firstName: parts[0],
    surname: parts[parts.length - 1],
    otherName: parts.slice(1, parts.length - 1).join(" "),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentFilter = searchParams.get("department") || "";
    const paymentStatusFilter = searchParams.get("paymentStatus") || "";
    const searchQuery = searchParams.get("search") || "";
    const format = searchParams.get("format") || "json";

    // 1. Load CMS rates
    let rates = DEFAULT_RATES;
    try {
      if ((prisma as any).deductionSetting) {
        const settings = await (prisma as any).deductionSetting.findUnique({
          where: { id: 1 },
        });
        if (settings) {
          rates = {
            ssnit_employee_rate: settings.ssnit_employee_rate ?? 5.5,
            ssnit_employer_rate: settings.ssnit_employer_rate ?? 13.0,
            petra_employee_rate: settings.petra_employee_rate ?? 5.0,
            petra_employer_rate: settings.petra_employer_rate ?? 5.0,
          };
        }
      }
    } catch {
      // Fallback to default rates
    }

    // 2. Fetch staff list
    const whereClause: any = {};
    if (departmentFilter && departmentFilter !== "all") {
      whereClause.department = departmentFilter;
    }
    if (paymentStatusFilter && paymentStatusFilter !== "all") {
      whereClause.payment_status = paymentStatusFilter;
    }

    const staffList = await prisma.staff.findMany({
      where: whereClause,
      include: {
        contracts: {
          orderBy: { start_date: "desc" },
        },
      },
      orderBy: { full_name: "asc" },
    });

    // 3. Include active, expiring soon, and expired staff (excluding early terminated)
    const activeStaff = staffList.filter((item: any) => {
      const currentContract = item.contracts.find((c: any) => c.is_current) || item.contracts[0] || null;
      if (!currentContract || currentContract.is_terminated) return false;
      const status = computeContractStatus(currentContract);
      return status === "Active" || status === "Expiring Soon" || status === "Expired";
    });

    let totalGrossSalary = 0;
    let totalSsnitEmpPool = 0;
    let totalSsnitErPool = 0;
    let totalPetraEmpPool = 0;
    let totalPetraErPool = 0;
    let totalPetraArrearsPool = 0;
    let totalEmployeeDeductionsPool = 0;
    let totalNetSalaryPool = 0;

    const petraBackpayStart = new Date("2025-11-01");
    const currentDate = new Date();

    let deductionsData = activeStaff.map((item: any) => {
      const isPaid = (item.payment_status || "paid") === "paid";
      const salary = item.salary ? Number(item.salary) : 0;

      const ghanaCalc = calculateGhanaDeductions(
        salary,
        isPaid,
        rates.ssnit_employee_rate,
        rates.ssnit_employer_rate,
        rates.petra_employee_rate,
        rates.petra_employer_rate
      );

      const ssnitEmp = ghanaCalc.ssnit_employee_amount;
      const ssnitEr = ghanaCalc.ssnit_employer_amount;
      const petraEmp = ghanaCalc.petra_employee_amount;
      const petraEr = ghanaCalc.petra_employer_amount;
      const payeTax = ghanaCalc.paye_tax_amount;
      const totalEmpDeduction = ghanaCalc.total_employee_deductions;
      const netSalary = ghanaCalc.net_take_home_salary;

      // Petra Back-Pay calculation (from Nov 2025)
      const currentContract = item.contracts.find((c: any) => c.is_current) || item.contracts[0] || null;
      const contractStart = currentContract ? new Date(currentContract.start_date) : petraBackpayStart;
      const effectivePetraStart = contractStart > petraBackpayStart ? contractStart : petraBackpayStart;

      const yearsDiff = currentDate.getFullYear() - effectivePetraStart.getFullYear();
      const monthsDiff = currentDate.getMonth() - effectivePetraStart.getMonth();
      const petraMonths = Math.max(1, yearsDiff * 12 + monthsDiff + 1);

      const petraEmpArrears = isPaid ? petraEmp * petraMonths : 0;
      const petraErArrears = isPaid ? petraEr * petraMonths : 0;
      const totalPetraArrears = petraEmpArrears + petraErArrears;

      if (isPaid) {
        totalGrossSalary += salary;
        totalSsnitEmpPool += ssnitEmp;
        totalSsnitErPool += ssnitEr;
        totalPetraEmpPool += petraEmp;
        totalPetraErPool += petraEr;
        totalPetraArrearsPool += totalPetraArrears;
        totalEmployeeDeductionsPool += totalEmpDeduction;
        totalNetSalaryPool += netSalary;
      }

      return {
        id: item.id,
        staff_code: item.staff_code || `EMP-${item.id}`,
        full_name: item.full_name,
        ssnit_no: item.ssnit_no || null,
        nia_number: item.nia_number || null,
        department: item.department || "N/A",
        role: item.role || "N/A",
        salary,
        payment_status: item.payment_status || "paid",
        unpaid_reason: item.unpaid_reason || null,
        ssnit_employee_amount: ssnitEmp,
        ssnit_employer_amount: ssnitEr,
        ssnit_total_amount: ssnitEmp + ssnitEr,
        petra_employee_amount: petraEmp,
        petra_employer_amount: petraEr,
        paye_tax_amount: payeTax,
        petra_backpay_start: "Nov 2025",
        petra_months_due: petraMonths,
        petra_emp_arrears: petraEmpArrears,
        petra_er_arrears: petraErArrears,
        petra_total_arrears: totalPetraArrears,
        total_employee_deductions: totalEmpDeduction,
        net_take_home_salary: netSalary,
        insurance_policy_no: item.insurance_policy_no || "N/A",
      };
    });

    // 4. Apply live search query if present
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      deductionsData = deductionsData.filter((row) => {
        return (
          row.full_name?.toLowerCase().includes(q) ||
          row.staff_code?.toLowerCase().includes(q) ||
          row.department?.toLowerCase().includes(q) ||
          (row.ssnit_no && row.ssnit_no.toLowerCase().includes(q)) ||
          (row.nia_number && row.nia_number.toLowerCase().includes(q))
        );
      });
    }

    const summary = {
      totalStaffCount: activeStaff.length,
      filteredCount: deductionsData.length,
      totalGrossSalary,
      totalSsnitEmpPool,
      totalSsnitErPool,
      totalSsnitCombined: totalSsnitEmpPool + totalSsnitErPool,
      totalPetraEmpPool,
      totalPetraErPool,
      totalPetraCombined: totalPetraEmpPool + totalPetraErPool,
      totalPetraArrearsPool,
      totalEmployeeDeductionsPool,
      totalNetSalaryPool,
      petraBackpayStartDate: "November 2025",
      rates,
    };

    // 5. Dedicated Official SSNIT Export (.xlsx) matching exact 12 columns
    if (format === "ssnit") {
      const ssnitExportRows = deductionsData.map((row: any, idx: number) => {
        const { firstName, surname, otherName } = parseName(row.full_name);
        const basicSalary = row.salary;
        const ssnitTier1 = Math.round(basicSalary * 0.135 * 100) / 100; // 13.5%
        const petraTier2 = Math.round(basicSalary * 0.05 * 100) / 100; // 5%
        const payeTax = row.paye_tax_amount;

        return {
          "S/NO.": idx + 1,
          "SSNIT NUMBER": row.ssnit_no || "N/A",
          "NIA NUMBER": row.nia_number || "N/A",
          "SURNAME": surname,
          "FIRST NAME": firstName,
          "OTHER NAME": otherName,
          "OPTION CODE (PNDCL 247/ACT 766)": "ACT 766",
          "HAZARDOUS (Y/N)": "N",
          "BASIC SALARY": basicSalary.toFixed(2),
          "SSNIT - TIER 1 (13.5%)": ssnitTier1.toFixed(2),
          "TIER 2 (5%)": petraTier2.toFixed(2),
          "GRA - PAYE DED.": payeTax.toFixed(2),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(ssnitExportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SSNIT Schedule");

      const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      const dateStr = new Date().toISOString().split("T")[0];

      return new NextResponse(buf as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Official_SSNIT_Schedule_${dateStr}.xlsx"`,
        },
      });
    }

    // 6. Full Excel Export (.xlsx)
    if (format === "excel") {
      const exportRows = deductionsData.map((row: any) => {
        const { firstName, surname, otherName } = parseName(row.full_name);
        return {
          "Staff Code": row.staff_code,
          "Full Name": row.full_name,
          "Surname": surname,
          "First Name": firstName,
          "Other Name": otherName,
          "SSNIT Number": row.ssnit_no || "N/A",
          "NIA Number": row.nia_number || "N/A",
          "Department": row.department,
          "Base Salary (GH₵)": row.salary.toFixed(2),
          [`SSNIT Employee (${rates.ssnit_employee_rate}%)`]: row.ssnit_employee_amount.toFixed(2),
          [`SSNIT Employer (${rates.ssnit_employer_rate}%)`]: row.ssnit_employer_amount.toFixed(2),
          "GRA PAYE Tax (GH₵)": row.paye_tax_amount.toFixed(2),
          "Total Employee Deductions (GH₵)": row.total_employee_deductions.toFixed(2),
          "Net Take-Home Pay (GH₵)": row.net_take_home_salary.toFixed(2),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Deductions Schedule");

      const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      const dateStr = new Date().toISOString().split("T")[0];

      return new NextResponse(buf as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Deductions_Schedule_${dateStr}.xlsx"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      summary,
      data: deductionsData,
    });
  } catch (error: any) {
    console.error("GET /api/deductions error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate deductions." },
      { status: 500 }
    );
  }
}
