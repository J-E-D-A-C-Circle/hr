import * as XLSX from "xlsx";
import { calculateEndDate, computeContractStatus, computeDaysRemaining, formatDateReadable } from "./status";

export interface MappedField {
  key: string;
  label: string;
  required: boolean;
}

export const TARGET_STAFF_FIELDS: MappedField[] = [
  { key: "staff_code", label: "Staff Code / Employee ID", required: false },
  { key: "full_name", label: "Full Name", required: true },
  { key: "role", label: "Role / Designation", required: false },
  { key: "department", label: "Station / Location", required: false },
  { key: "phone", label: "Phone Number", required: false },
  { key: "bank_name", label: "Bank Name", required: false },
  { key: "bank_account", label: "Bank Account No.", required: false },
  { key: "salary", label: "Monthly Salary (GH₵)", required: false },
  { key: "insurance_provider", label: "Insurance Provider", required: false },
  { key: "insurance_policy_no", label: "Insurance Policy No.", required: false },
  { key: "insurance_premium", label: "Insurance Premium (GH₵)", required: false },
  { key: "start_date", label: "Contract Start Date (YYYY-MM-DD)", required: true },
];

/**
 * Auto-matches excel column names to schema target field keys using fuzzy name match
 */
export function autoSuggestMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  headers.forEach((header) => {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (normalized.includes("code") || normalized.includes("empid") || normalized.includes("staffid")) {
      mapping[header] = "staff_code";
    } else if (normalized.includes("name") || normalized.includes("full")) {
      mapping[header] = "full_name";
    } else if (normalized.includes("role") || normalized.includes("title") || normalized.includes("position") || normalized.includes("designation")) {
      mapping[header] = "role";
    } else if (normalized.includes("station") || normalized.includes("location") || normalized.includes("office") || normalized.includes("site") || normalized.includes("dept") || normalized.includes("department")) {
      mapping[header] = "department";
    } else if (normalized.includes("phone") || normalized.includes("mobile") || normalized.includes("contact")) {
      mapping[header] = "phone";
    } else if (normalized.includes("bankname") || normalized.includes("bank")) {
      mapping[header] = "bank_name";
    } else if (normalized.includes("account") || normalized.includes("acct")) {
      mapping[header] = "bank_account";
    } else if (normalized.includes("salary") || normalized.includes("wage") || normalized.includes("pay")) {
      mapping[header] = "salary";
    } else if (normalized.includes("provider") || normalized.includes("insurer")) {
      mapping[header] = "insurance_provider";
    } else if (normalized.includes("policy") || normalized.includes("policyno")) {
      mapping[header] = "insurance_policy_no";
    } else if (normalized.includes("premium")) {
      mapping[header] = "insurance_premium";
    } else if (normalized.includes("start") || normalized.includes("startdate") || normalized.includes("hiredate")) {
      mapping[header] = "start_date";
    }
  });

  return mapping;
}

export interface ParsedRowResult {
  rowIndex: number;
  data: Record<string, any>;
  errors: string[];
  isValid: boolean;
}

/**
 * Validates parsed raw excel rows according to column mapping
 */
export function validateMappedRows(
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>,
  existingStaffCodes: Set<string>
): ParsedRowResult[] {
  const seenCodesInSheet = new Set<string>();

  return rawRows.map((row, idx) => {
    const mapped: Record<string, any> = {};
    const errors: string[] = [];

    // Map fields
    Object.entries(columnMapping).forEach(([excelCol, schemaKey]) => {
      if (schemaKey && row[excelCol] !== undefined) {
        mapped[schemaKey] = row[excelCol];
      }
    });

    // Validate Required: Full Name
    if (!mapped.full_name || String(mapped.full_name).trim() === "") {
      errors.push("Missing required field: Full Name");
    }

    // Validate Required: Start Date
    if (!mapped.start_date) {
      errors.push("Missing required field: Contract Start Date");
    } else {
      const parsedDate = new Date(mapped.start_date);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Invalid start date format: "${mapped.start_date}"`);
      } else {
        mapped.start_date_parsed = parsedDate;
        mapped.end_date_parsed = calculateEndDate(parsedDate);
      }
    }

    // Validate Duplicate Staff Code
    if (mapped.staff_code) {
      const code = String(mapped.staff_code).trim();
      if (existingStaffCodes.has(code)) {
        errors.push(`Duplicate staff code in DB: "${code}"`);
      } else if (seenCodesInSheet.has(code)) {
        errors.push(`Duplicate staff code in uploaded file: "${code}"`);
      } else {
        seenCodesInSheet.add(code);
      }
    }

    // Parse Numeric fields
    if (mapped.salary !== undefined && mapped.salary !== null && mapped.salary !== "") {
      const sal = parseFloat(String(mapped.salary).replace(/[^0-9.]/g, ""));
      if (isNaN(sal)) errors.push("Invalid salary format");
      else mapped.salary = sal;
    }

    if (mapped.insurance_premium !== undefined && mapped.insurance_premium !== null && mapped.insurance_premium !== "") {
      const prem = parseFloat(String(mapped.insurance_premium).replace(/[^0-9.]/g, ""));
      if (isNaN(prem)) errors.push("Invalid insurance premium format");
      else mapped.insurance_premium = prem;
    }

    return {
      rowIndex: idx + 2, // Excel row line number (1 is header)
      data: mapped,
      errors,
      isValid: errors.length === 0,
    };
  });
}

/**
 * Generates an Excel workbook Buffer for Payroll export
 */
export function buildExportWorkbook(staffRecords: any[]): Buffer {
  const exportRows = staffRecords.map((item) => {
    const currentContract = item.contracts?.find((c: any) => c.is_current) || item.contracts?.[0];
    const status = computeContractStatus(currentContract);
    const daysRemaining = currentContract ? computeDaysRemaining(currentContract.end_date) : 0;

    return {
      "Staff Code": item.staff_code || `EMP-${item.id}`,
      "Full Name": item.full_name,
      "Gender": item.gender || "N/A",
      "Email": item.email || "N/A",
      "Date of Birth": item.date_of_birth ? formatDateReadable(item.date_of_birth) : "N/A",
      "SSNIT Number": item.ssnit_no || "N/A",
      "NIA Number (Ghana Card)": item.nia_number || "N/A",
      "Station": item.department || "N/A",
      "Role": item.role || "N/A",
      "Phone": item.phone || "N/A",
      "Bank Name": item.bank_name || "N/A",
      "Bank Branch": item.bank_branch || "N/A",
      "Bank Account No.": item.bank_account || "N/A",
      "Monthly Salary (GH₵)": item.salary ? Number(item.salary).toFixed(2) : "0.00",
      "Payment Status": item.payment_status || "paid",
      "Contract Start Date": currentContract ? formatDateReadable(currentContract.start_date) : "N/A",
      "Contract End Date": currentContract ? formatDateReadable(currentContract.end_date) : "N/A",
      "Days Remaining": currentContract && !currentContract.is_terminated ? daysRemaining : "N/A",
      "Contract Status": status,
      "Renewal Count": currentContract ? currentContract.renewal_number : 1,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Payroll");

  // Write as buffer
  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buf;
}

/**
 * Builds Payroll Payment Workbook matching TEMP JULY.xlsx format
 */
export function buildPayrollPaymentWorkbook(staffRecords: any[], monthStr: string = "August 2026"): Buffer {
  const titleHeader = [`TEMPORARY STAFF PAYROLL FOR ${monthStr.toUpperCase()}`];
  const colHeaders = [
    "Sr. No.",
    "EMPLOYEE ID",
    "EMPLOYEE NAME",
    "LOCATION",
    "START DATE",
    "END DATE",
    "BASIC",
    "GROSS SALARY",
    "N0. OF MONTHS",
    "TOTAL GROSS SALARY",
    "NSSF(5.5%)",
    "NSSF(13%)",
    "TOTAL PAY COST",
    "TOTAL TAXABLE AMOUNT",
    "INCOME TAX",
    "TOTAL DEDUCTION",
    "NET PAY",
  ];

  const dataRows = staffRecords.map((item, idx) => {
    const currentContract = item.contracts?.find((c: any) => c.is_current) || item.contracts?.[0];
    const basic = item.salary ? Number(item.salary) : 1400.00;
    const gross = basic;
    const months = 1;
    const totalGross = gross * months;

    const nssf55 = Math.round(totalGross * 0.055 * 100) / 100;
    const nssf13 = Math.round(totalGross * 0.13 * 100) / 100;
    const totalPayCost = Math.round((totalGross + nssf13) * 100) / 100;
    const totalTaxable = Math.round((totalGross - nssf55) * 100) / 100;
    const incomeTax = 122.28; // Standard GRA PAYE bracket tax
    const totalDeduction = Math.round((nssf55 + incomeTax) * 100) / 100;
    const netPay = Math.round((totalGross - totalDeduction) * 100) / 100;

    return [
      idx + 1,
      item.staff_code || `EMP-${item.id}`,
      item.full_name,
      item.department || "General",
      currentContract ? formatDateReadable(currentContract.start_date) : "N/A",
      currentContract ? formatDateReadable(currentContract.end_date) : "N/A",
      basic,
      gross,
      months,
      totalGross,
      nssf55,
      nssf13,
      totalPayCost,
      totalTaxable,
      incomeTax,
      totalDeduction,
      netPay,
    ];
  });

  const sheetData = [titleHeader, colHeaders, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "PAYROLL PAYMENT");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Builds SSNIT Contribution Report Workbook matching JUNE SSNIT.xlsx format
 */
export function buildSsnitContributionWorkbook(staffRecords: any[], monthStr: string = "August 2026"): Buffer {
  const header1 = ["NEW FORMAT FOR CONTRIBUTION REPORT SUBMISSION"];
  const header2 = ["ESTABLISHMENT NAME:…", "", "DRIVER AND VEHICLE LICENSING AUTHORITY"];
  const header3 = ["ER NO:…201606660…………………………………………………………………………………………………"];
  const header4 = [`MONTH: ${monthStr.toUpperCase()}..`, "", "", "CONTACT NUMBERS:………………………………………………………", "0244975955 AND '0244772715", "", "CATEGORY……………ALL…………………………."];
  const colHeaders = [
    "S/NO.",
    "SSNIT NUMBER ",
    "NIA NUMBER ",
    "SURNAME ",
    "FIRST NAME ",
    "OTHER NAME ",
    "OPTION CODE   (PNDCL 247/ACT 766)",
    "HAZARDOUS (Y/N)",
    "BASIC SALARY ",
    "SSNIT - TIER 1 (13.5%)",
    "PETRA - TIER 2 (5%)",
    "GRA - PAYE DED.",
  ];

  const dataRows = staffRecords.map((item, idx) => {
    const nameParts = (item.full_name || "").trim().split(/\s+/);
    let firstName = "";
    let surname = "";
    let otherName = "";

    if (nameParts.length === 1) {
      firstName = nameParts[0];
    } else if (nameParts.length === 2) {
      firstName = nameParts[0];
      surname = nameParts[1];
    } else if (nameParts.length >= 3) {
      firstName = nameParts[0];
      surname = nameParts[nameParts.length - 1];
      otherName = nameParts.slice(1, -1).join(" ");
    }

    const basic = item.salary ? Number(item.salary) : 1400.00;
    const tier1 = Math.round(basic * 0.135 * 100) / 100;
    const tier2 = Math.round(basic * 0.05 * 100) / 100;
    const graPaye = 122.28;

    return [
      idx + 1,
      item.ssnit_no || "",
      item.nia_number || "",
      surname,
      firstName,
      otherName,
      "ACT 766",
      "",
      basic,
      tier1,
      tier2,
      graPaye,
    ];
  });

  const sheetData = [header1, header2, header3, header4, colHeaders, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SSNIT CONTRIBUTION");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
