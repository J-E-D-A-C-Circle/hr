import ExcelJS from "exceljs";
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
  { key: "start_date", label: "Contract Start Date (DD/MM/YYYY)", required: true },
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

// =========================================================
// GREEN THEME EXCEL STYLING UTILITIES
// =========================================================
const GREEN_THEME = {
  headerBg: "FF064E3B",      // Deep Forest Emerald Green
  headerFont: "FFFFFFFF",    // White
  subHeaderBg: "FFD1FAE5",   // Soft Sage / Mint Green
  subHeaderFont: "FF065F46", // Dark Emerald Text
  altRowBg: "FFF0FDF4",      // Light Mint Tint
  totalBg: "FFD1FAE5",       // Mint Green Total Row
  totalFont: "FF064E3B",     // Bold Dark Green Text
  borderColor: "FFD1D5DB",   // Light Gray Border
  accentBorder: "FF047857",  // Emerald Border
};

const CURRENCY_FORMAT = '"GH₵"#,##0.00;("GH₵"#,##0.00);"-"';

function applyAutoColumnWidths(worksheet: ExcelJS.Worksheet) {
  worksheet.columns.forEach((column) => {
    let maxLen = 14;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellVal = cell.value !== undefined && cell.value !== null ? String(cell.value) : "";
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    });
    column.width = Math.min(Math.max(maxLen + 4, 14), 45);
  });
}

/**
 * Builds Standard Staff Directory Export Workbook with Green Styling
 */
export async function buildExportWorkbook(staffRecords: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DVLA Temporary Staff HR Platform";
  workbook.created = new Date();

  const addDirectorySheet = (sheetName: string, titleSuffix: string, records: any[]) => {
    const worksheet = workbook.addWorksheet(sheetName);

    // Title Banner Row
    worksheet.mergeCells("A1:T1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `DRIVER AND VEHICLE LICENSING AUTHORITY (DVLA) - ${titleSuffix.toUpperCase()}`;
    titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: GREEN_THEME.headerFont } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.headerBg } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 36;

    // Sub-banner info
    worksheet.mergeCells("A2:T2");
    const subCell = worksheet.getCell("A2");
    subCell.value = `TOTAL RECORDS: ${records.length} | EXPORT DATE: ${new Date().toLocaleDateString("en-GB")}`;
    subCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: GREEN_THEME.subHeaderFont } };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.subHeaderBg } };
    subCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 24;

    // Headers
    const colHeaders = [
      "Staff Code",
      "Full Name",
      "Gender",
      "Email",
      "Date of Birth",
      "SSNIT Number",
      "NIA Number (Ghana Card)",
      "Station / Department",
      "Role / Position",
      "Phone Number",
      "Bank Name",
      "Bank Branch",
      "Bank Account No.",
      "Monthly Salary",
      "Payment Status",
      "Contract Start Date",
      "Contract End Date",
      "Days Remaining",
      "Contract Status",
      "Renewal Count",
    ];

    const headerRow = worksheet.addRow(colHeaders);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
        bottom: { style: "medium", color: { argb: GREEN_THEME.headerBg } },
        left: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
        right: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
      };
    });

    let totalSalary = 0;

    // Data rows
    records.forEach((item, idx) => {
      const currentContract = item.contracts?.find((c: any) => c.is_current) || item.contracts?.[0];
      const status = item.computedStatus || computeContractStatus(currentContract);
      const daysRemaining = currentContract ? computeDaysRemaining(currentContract.end_date) : 0;
      const salary = item.salary ? Number(item.salary) : 0;
      totalSalary += salary;

      const rowValues = [
        item.staff_code || `EMP-${item.id}`,
        item.full_name,
        item.gender || "N/A",
        item.email || "N/A",
        item.date_of_birth ? formatDateReadable(item.date_of_birth) : "N/A",
        item.ssnit_no || "N/A",
        item.nia_number || "N/A",
        item.department || "N/A",
        item.role || "N/A",
        item.phone || "N/A",
        item.bank_name || "N/A",
        item.bank_branch || "N/A",
        item.bank_account || "N/A",
        salary,
        (item.payment_status || "paid").toUpperCase(),
        currentContract ? formatDateReadable(currentContract.start_date) : "N/A",
        currentContract ? formatDateReadable(currentContract.end_date) : "N/A",
        currentContract && !currentContract.is_terminated ? daysRemaining : "N/A",
        status,
        currentContract ? currentContract.renewal_number : 1,
      ];

      const dataRow = worksheet.addRow(rowValues);
      dataRow.height = 22;
      const isAlt = idx % 2 === 1;

      dataRow.eachCell((cell, colIndex) => {
        cell.font = { name: "Calibri", size: 10 };
        cell.border = {
          top: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
          bottom: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
          left: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
          right: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        };

        if (isAlt) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.altRowBg } };
        }

        if (colIndex === 14) {
          (cell as any).numFmt = CURRENCY_FORMAT;
          cell.alignment = { horizontal: "right", vertical: "middle" };
          cell.font = { name: "Calibri", size: 10, bold: true };
        } else if ([1, 3, 5, 6, 7, 15, 16, 17, 18, 19, 20].includes(colIndex)) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }
      });
    });

    // Summary Row at Bottom
    const totalRowValues = Array(20).fill("");
    totalRowValues[0] = "TOTALS / SUMMARY";
    totalRowValues[13] = totalSalary;

    const summaryRow = worksheet.addRow(totalRowValues);
    summaryRow.height = 26;
    summaryRow.eachCell((cell, colIndex) => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: GREEN_THEME.totalFont } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.totalBg } };
      cell.border = {
        top: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
        bottom: { style: "double", color: { argb: GREEN_THEME.accentBorder } },
        left: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        right: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
      };

      if (colIndex === 14) {
        (cell as any).numFmt = CURRENCY_FORMAT;
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });

    applyAutoColumnWidths(worksheet);
  };

  // 1. All Staff Master Sheet (Contains ALL Employees in database)
  addDirectorySheet("All Staff Master", "Full Staff Directory (All Employees)", staffRecords);

  // 2. Active Employees Sheet
  const activeRecords = staffRecords.filter(r => (r.computedStatus || computeContractStatus(r.contracts?.[0])) === "Active");
  addDirectorySheet("Active Employees", "Active Staff Directory", activeRecords);

  // 3. Expiring Soon Sheet
  const expiringRecords = staffRecords.filter(r => (r.computedStatus || computeContractStatus(r.contracts?.[0])) === "Expiring Soon");
  addDirectorySheet("Expiring Soon", "Expiring Contracts (Within 30 Days)", expiringRecords);

  // 4. Expired Contracts Sheet
  const expiredRecords = staffRecords.filter(r => (r.computedStatus || computeContractStatus(r.contracts?.[0])) === "Expired");
  addDirectorySheet("Expired Contracts", "Expired Contracts Directory", expiredRecords);

  // 5. Terminated Staff Sheet
  const terminatedRecords = staffRecords.filter(r => (r.computedStatus || computeContractStatus(r.contracts?.[0])) === "Terminated");
  addDirectorySheet("Terminated Staff", "Terminated Staff Directory", terminatedRecords);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export const ACH_BANK_LOOKUP: Record<string, { bankCode: string; locationCode: string }> = {
  "STANDARD CHARTERED": { bankCode: "02", locationCode: "020101" },
  "ABSA": { bankCode: "03", locationCode: "030105" },
  "BARCLAYS": { bankCode: "03", locationCode: "030105" },
  "GCB": { bankCode: "04", locationCode: "040101" },
  "GHANA COMMERCIAL BANK": { bankCode: "04", locationCode: "040101" },
  "NIB": { bankCode: "05", locationCode: "050131" },
  "NATIONAL INVESTMENT BANK": { bankCode: "05", locationCode: "050131" },
  "UBA": { bankCode: "06", locationCode: "060101" },
  "UNITED BANK FOR AFRICA": { bankCode: "06", locationCode: "060101" },
  "RURAL BANKS": { bankCode: "07", locationCode: "070615" },
  "RURAL BANK": { bankCode: "07", locationCode: "070615" },
  "ADB": { bankCode: "08", locationCode: "080100" },
  "AGRICULTURAL DEVELOPMENT BANK": { bankCode: "08", locationCode: "080100" },
  "SOCIETE GENERALE": { bankCode: "09", locationCode: "090115" },
  "SOCIETE GENERAL": { bankCode: "09", locationCode: "090115" },
  "UMB": { bankCode: "10", locationCode: "100101" },
  "UNIVERSAL MERCHANT BANK": { bankCode: "10", locationCode: "100101" },
  "HFC": { bankCode: "11", locationCode: "110104" },
  "REPUBLIC": { bankCode: "11", locationCode: "110104" },
  "HFC/REPUBLIC": { bankCode: "11", locationCode: "110104" },
  "ZENITH": { bankCode: "12", locationCode: "120105" },
  "ZENITH BANK": { bankCode: "12", locationCode: "120105" },
  "ECOBANK": { bankCode: "13", locationCode: "130101" },
  "CAL": { bankCode: "14", locationCode: "140100" },
  "CAL BANK": { bankCode: "14", locationCode: "140100" },
  "FIRST ATLANTIC": { bankCode: "17", locationCode: "170114" },
  "FIRST ATLANTIC BANK": { bankCode: "17", locationCode: "170114" },
  "PRUDENTIAL": { bankCode: "18", locationCode: "180109" },
  "PRUDENTIAL BANK": { bankCode: "18", locationCode: "180109" },
  "STANBIC": { bankCode: "19", locationCode: "190101" },
  "STANBIC BANK": { bankCode: "19", locationCode: "190101" },
  "FBN": { bankCode: "20", locationCode: "200113" },
  "BANK OF AFRICA": { bankCode: "21", locationCode: "210601" },
  "GT": { bankCode: "23", locationCode: "230101" },
  "GT BANK": { bankCode: "23", locationCode: "230101" },
  "GUARANTY TRUST BANK": { bankCode: "23", locationCode: "230101" },
  "FIDELITY": { bankCode: "24", locationCode: "240100" },
  "FIDELITY BANK": { bankCode: "24", locationCode: "240100" },
  "ACCESS": { bankCode: "28", locationCode: "280100" },
  "ACCESS BANK": { bankCode: "28", locationCode: "280100" },
  "FIRST NATIONAL BANK": { bankCode: "33", locationCode: "330102" },
  "FNB": { bankCode: "33", locationCode: "330102" },
  "CBG": { bankCode: "34", locationCode: "340102" },
  "CONSOLIDATED BANK": { bankCode: "34", locationCode: "340102" },
  "CONSOLIDATED BANK GHANA": { bankCode: "34", locationCode: "340102" },
};

export function getAchBankDetails(bankName: string, bankBranch?: string): { bankCode: string; locationCode: string } {
  if (!bankName) return { bankCode: "00", locationCode: "000000" };

  const norm = bankName.toUpperCase().replace(/[^A-Z0-9]/g, " ").trim();

  for (const key of Object.keys(ACH_BANK_LOOKUP)) {
    if (norm.includes(key) || key.includes(norm)) {
      const match = ACH_BANK_LOOKUP[key];
      let loc = match.locationCode;
      if (bankBranch) {
        const digits = bankBranch.replace(/[^0-9]/g, "");
        if (digits.length >= 6) {
          loc = digits;
        }
      }
      return { bankCode: match.bankCode, locationCode: loc };
    }
  }

  // Fallback checks
  if (norm.includes("GCB") || norm.includes("COMMERCIAL")) return { bankCode: "04", locationCode: "040101" };
  if (norm.includes("ECOBANK")) return { bankCode: "13", locationCode: "130101" };
  if (norm.includes("ABSA") || norm.includes("BARCLAYS")) return { bankCode: "03", locationCode: "030105" };
  if (norm.includes("STANBIC")) return { bankCode: "19", locationCode: "190101" };
  if (norm.includes("ADB")) return { bankCode: "08", locationCode: "080100" };
  if (norm.includes("FIDELITY")) return { bankCode: "24", locationCode: "240100" };
  if (norm.includes("CBG") || norm.includes("CONSOLIDATED")) return { bankCode: "34", locationCode: "340102" };
  if (norm.includes("CAL")) return { bankCode: "14", locationCode: "140100" };
  if (norm.includes("GT")) return { bankCode: "23", locationCode: "230101" };
  if (norm.includes("ACCESS")) return { bankCode: "28", locationCode: "280100" };
  if (norm.includes("ZENITH")) return { bankCode: "12", locationCode: "120105" };
  if (norm.includes("UBA")) return { bankCode: "06", locationCode: "060101" };
  if (norm.includes("PRUDENTIAL")) return { bankCode: "18", locationCode: "180109" };

  return { bankCode: "00", locationCode: "000000" };
}

/**
 * Builds Payroll Payment Workbook matching exact GIFMIS / Oracle Financials Payment Schema:
 * LINE_NUMBER | AMOUNT | ATTRIBUTE_CATEGORY | ATTRIBUTE1 | ATTRIBUTE2 | ATTRIBUTE3 | ATTRIBUTE4 | ATTRIBUTE5 | DESCRIPTION
 */
export async function buildPayrollPaymentWorkbook(staffRecords: any[], monthStr: string = "August 2026"): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DVLA Temporary Staff HR Platform";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("PAYROLL PAYMENT");

  // Exact 9 Column Headers matching GIFMIS Oracle Financials Format
  const colHeaders = [
    "LINE_NUMBER",
    "AMOUNT",
    "ATTRIBUTE_CATEGORY",
    "ATTRIBUTE1",
    "ATTRIBUTE2",
    "ATTRIBUTE3",
    "ATTRIBUTE4",
    "ATTRIBUTE5",
    "DESCRIPTION",
  ];

  const headerRow = worksheet.addRow(colHeaders);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "medium", color: { argb: GREEN_THEME.headerBg } },
      bottom: { style: "medium", color: { argb: GREEN_THEME.headerBg } },
      left: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
      right: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
    };
  });

  let totalAmount = 0;
  const descText = `TEMP STAFF-ALLOWANCE ${monthStr.toUpperCase()}`;

  staffRecords.forEach((item, idx) => {
    const basic = item.salary ? Number(item.salary) : 1400.00;
    const ssnitEmployee = Math.round(basic * 0.055 * 100) / 100;
    const graPaye = 122.28;
    const totalDeduction = Math.round((ssnitEmployee + graPaye) * 100) / 100;
    const netPay = Math.round((basic - totalDeduction) * 100) / 100;

    totalAmount += netPay;

    const ach = getAchBankDetails(item.bank_name, item.bank_branch);

    const rowValues = [
      idx + 1,                                  // LINE_NUMBER
      netPay,                                  // AMOUNT
      "Non Employee",                          // ATTRIBUTE_CATEGORY
      item.staff_code || `EMP-${item.id}`,     // ATTRIBUTE1 (Staff Code)
      (item.full_name || "").toUpperCase(),    // ATTRIBUTE2 (Staff Full Name)
      ach.bankCode,                             // ATTRIBUTE3 (Bank Code)
      ach.locationCode,                        // ATTRIBUTE4 (Location Code)
      item.bank_account || "N/A",              // ATTRIBUTE5 (Bank Account Number)
      descText,                                // DESCRIPTION
    ];

    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 22;
    const isAlt = idx % 2 === 1;

    dataRow.eachCell((cell, colIdx) => {
      cell.font = { name: "Calibri", size: 10 };
      cell.border = {
        top: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        bottom: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        left: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        right: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
      };

      if (isAlt) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.altRowBg } };
      }

      if (colIdx === 2) {
        // AMOUNT
        (cell as any).numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.font = { name: "Calibri", size: 10, bold: true };
      } else if ([1, 3, 4, 6, 7, 8].includes(colIdx)) {
        // LINE_NUMBER, ATTRIBUTE_CATEGORY, ATTRIBUTE1, ATTRIBUTE3 (BANK), ATTRIBUTE4 (LOCATION), ATTRIBUTE5 (ACCOUNT NO)
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if ([6, 7, 8].includes(colIdx)) {
          (cell as any).numFmt = "@";
        }
      } else {
        // ATTRIBUTE2 (NAME), DESCRIPTION
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });
  });

  // Summary Totals Row
  const totalsRowValues = [
    "TOTALS",
    totalAmount,
    `TOTAL STAFF: ${staffRecords.length}`,
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  const totalRow = worksheet.addRow(totalsRowValues);
  totalRow.height = 28;

  totalRow.eachCell((cell, colIdx) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: GREEN_THEME.totalFont } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.totalBg } };
    cell.border = {
      top: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
      bottom: { style: "double", color: { argb: GREEN_THEME.accentBorder } },
      left: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
      right: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
    };

    if (colIdx === 2) {
      (cell as any).numFmt = "#,##0.00";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  applyAutoColumnWidths(worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Builds SSNIT Contribution Report Workbook with Green Theme
 */
export async function buildSsnitContributionWorkbook(staffRecords: any[], monthStr: string = "August 2026"): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DVLA Temporary Staff HR Platform";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("SSNIT CONTRIBUTION");

  // Header 1
  worksheet.mergeCells("A1:L1");
  const title1 = worksheet.getCell("A1");
  title1.value = "NEW FORMAT FOR CONTRIBUTION REPORT SUBMISSION";
  title1.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  title1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.headerBg } };
  title1.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 32;

  // Header 2
  worksheet.mergeCells("A2:L2");
  const title2 = worksheet.getCell("A2");
  title2.value = `ESTABLISHMENT: DRIVER AND VEHICLE LICENSING AUTHORITY (DVLA) | ER NO: 201606660 | MONTH: ${monthStr.toUpperCase()}`;
  title2.font = { name: "Calibri", size: 10, bold: true, color: { argb: GREEN_THEME.subHeaderFont } };
  title2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.subHeaderBg } };
  title2.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 24;

  const colHeaders = [
    "S/NO.",
    "SSNIT NUMBER",
    "NIA NUMBER",
    "SURNAME",
    "FIRST NAME",
    "OTHER NAME",
    "OPTION CODE",
    "HAZARDOUS",
    "BASIC SALARY",
    "SSNIT - TIER 1 (13.5%)",
    "PETRA - TIER 2 (5%)",
    "GRA - PAYE DED.",
  ];

  const headerRow = worksheet.addRow(colHeaders);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
      bottom: { style: "medium", color: { argb: GREEN_THEME.headerBg } },
      left: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
      right: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
    };
  });

  let sumBasic = 0;
  let sumTier1 = 0;
  let sumTier2 = 0;
  let sumGraPaye = 0;

  staffRecords.forEach((item, idx) => {
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

    sumBasic += basic;
    sumTier1 += tier1;
    sumTier2 += tier2;
    sumGraPaye += graPaye;

    const rowValues = [
      idx + 1,
      item.ssnit_no || "N/A",
      item.nia_number || "N/A",
      surname,
      firstName,
      otherName,
      "ACT 766",
      "N",
      basic,
      tier1,
      tier2,
      graPaye,
    ];

    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 22;
    const isAlt = idx % 2 === 1;

    dataRow.eachCell((cell, colIdx) => {
      cell.font = { name: "Calibri", size: 10 };
      cell.border = {
        top: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        bottom: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        left: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        right: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
      };

      if (isAlt) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.altRowBg } };
      }

      if ([9, 10, 11, 12].includes(colIdx)) {
        (cell as any).numFmt = CURRENCY_FORMAT;
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if ([1, 2, 3, 7, 8].includes(colIdx)) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });
  });

  // Totals Row
  const totalsRowValues = [
    "TOTALS",
    "",
    `TOTAL STAFF: ${staffRecords.length}`,
    "",
    "",
    "",
    "",
    "",
    sumBasic,
    sumTier1,
    sumTier2,
    sumGraPaye,
  ];

  const totalRow = worksheet.addRow(totalsRowValues);
  totalRow.height = 28;

  totalRow.eachCell((cell, colIdx) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: GREEN_THEME.totalFont } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.totalBg } };
    cell.border = {
      top: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
      bottom: { style: "double", color: { argb: GREEN_THEME.accentBorder } },
      left: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
      right: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
    };

    if ([9, 10, 11, 12].includes(colIdx)) {
      (cell as any).numFmt = CURRENCY_FORMAT;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  applyAutoColumnWidths(worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Builds Individual Staff Payslip Excel Workbook with Green Theme
 */
export async function buildSinglePayslipWorkbook(staffRecord: any, monthStr: string = "August 2026"): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DVLA Temporary Staff HR Platform";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("PAYSLIP");

  const currentContract = staffRecord.contracts?.find((c: any) => c.is_current) || staffRecord.contracts?.[0];
  const basic = staffRecord.salary ? Number(staffRecord.salary) : 1400.00;
  const ssnitTier1 = Math.round(basic * 0.135 * 100) / 100;
  const petraTier2 = Math.round(basic * 0.05 * 100) / 100;
  const ssnitEmployee = Math.round(basic * 0.055 * 100) / 100;
  const graPaye = 122.28;
  const totalDeductions = Math.round((ssnitEmployee + graPaye) * 100) / 100;
  const netPay = Math.round((basic - totalDeductions) * 100) / 100;

  // Header Banner 1
  worksheet.mergeCells("A1:E1");
  const title1 = worksheet.getCell("A1");
  title1.value = "DRIVER AND VEHICLE LICENSING AUTHORITY (DVLA)";
  title1.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  title1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.headerBg } };
  title1.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 34;

  // Header Banner 2
  worksheet.mergeCells("A2:E2");
  const title2 = worksheet.getCell("A2");
  title2.value = `OFFICIAL SALARY PAYSLIP - ${monthStr.toUpperCase()}`;
  title2.font = { name: "Calibri", size: 12, bold: true, color: { argb: GREEN_THEME.subHeaderFont } };
  title2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.subHeaderBg } };
  title2.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 24;

  // Blank row 3
  worksheet.getRow(3).height = 10;

  // Employee Profile Grid (Rows 4-9)
  const profileData = [
    ["EMPLOYEE DETAILS", "", "", "", ""],
    ["Staff Code / ID:", staffRecord.staff_code || `EMP-${staffRecord.id}`, "", "Pay Period:", monthStr],
    ["Full Name:", staffRecord.full_name, "", "Department / Station:", staffRecord.department || "N/A"],
    ["SSNIT Number:", staffRecord.ssnit_no || "N/A", "", "Role / Designation:", staffRecord.role || "Temporary Staff"],
    ["Ghana Card (NIA):", staffRecord.nia_number || "N/A", "", "Bank Name:", staffRecord.bank_name || "N/A"],
    ["Bank Account No:", staffRecord.bank_account || "N/A", "", "Bank Branch:", staffRecord.bank_branch || "N/A"],
  ];

  profileData.forEach((rowVals, rIdx) => {
    const rowNum = rIdx + 4;
    const row = worksheet.getRow(rowNum);
    row.values = rowVals;

    if (rIdx === 0) {
      worksheet.mergeCells(`A${rowNum}:E${rowNum}`);
      const c = worksheet.getCell(`A${rowNum}`);
      c.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
      c.alignment = { horizontal: "left", vertical: "middle" };
      row.height = 24;
    } else {
      row.height = 20;
      const cA = worksheet.getCell(`A${rowNum}`);
      const cD = worksheet.getCell(`D${rowNum}`);
      cA.font = { name: "Calibri", size: 10, bold: true };
      cD.font = { name: "Calibri", size: 10, bold: true };
    }
  });

  // Blank row 10
  worksheet.getRow(10).height = 10;

  // Earnings & Deductions Table Header (Row 11)
  worksheet.getRow(11).values = ["PAY ELEMENTS", "EARNINGS (GH₵)", "", "DEDUCTIONS", "AMOUNT (GH₵)"];
  worksheet.mergeCells("A11:B11");
  worksheet.mergeCells("D11:E11");
  const h11 = worksheet.getRow(11);
  h11.height = 26;
  h11.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Financial Rows (Rows 12-16)
  const finRows = [
    ["Basic Salary", basic, "", "SSNIT Employee (5.5%)", ssnitEmployee],
    ["", "", "", "GRA PAYE Tax", graPaye],
    ["", "", "", "SSNIT Employer (13%)", ssnitTier1],
    ["", "", "", "Petra Tier 2 (5%)", petraTier2],
    ["GROSS EARNINGS", basic, "", "TOTAL DEDUCTIONS", totalDeductions],
  ];

  finRows.forEach((rVals, rIdx) => {
    const rowNum = rIdx + 12;
    const row = worksheet.getRow(rowNum);
    row.values = rVals;
    row.height = 22;

    const isGrossTotal = rIdx === 4;

    row.eachCell((cell, colIdx) => {
      cell.font = { name: "Calibri", size: 10, bold: isGrossTotal };
      cell.border = {
        top: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        bottom: { style: isGrossTotal ? "medium" : "thin", color: { argb: GREEN_THEME.borderColor } },
        left: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        right: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
      };

      if (isGrossTotal) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.altRowBg } };
      }

      if ([2, 5].includes(colIdx) && cell.value !== "") {
        (cell as any).numFmt = CURRENCY_FORMAT;
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }
    });
  });

  // Blank row 17
  worksheet.getRow(17).height = 10;

  // NET PAY Row (Row 18)
  worksheet.mergeCells("A18:C18");
  worksheet.mergeCells("D18:E18");
  const netRow = worksheet.getRow(18);
  netRow.values = ["NET TAKE-HOME PAY (GH₵):", "", "", netPay, ""];
  netRow.height = 32;

  const netLabel = worksheet.getCell("A18");
  netLabel.font = { name: "Calibri", size: 12, bold: true, color: { argb: GREEN_THEME.totalFont } };
  netLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.totalBg } };
  netLabel.alignment = { horizontal: "right", vertical: "middle" };

  const netVal = worksheet.getCell("D18");
  netVal.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF047857" } };
  netVal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.totalBg } };
  (netVal as any).numFmt = CURRENCY_FORMAT;
  netVal.alignment = { horizontal: "right", vertical: "middle" };
  netVal.border = {
    top: { style: "medium", color: { argb: GREEN_THEME.accentBorder } },
    bottom: { style: "double", color: { argb: GREEN_THEME.accentBorder } },
  };

  // Signatures Row (Row 21)
  worksheet.getRow(20).height = 15;
  worksheet.getRow(21).values = ["Prepared By: ___________________", "", "", "Employee Signature: ___________________", ""];
  worksheet.getRow(21).height = 24;
  worksheet.getCell("A21").font = { name: "Calibri", size: 10, italic: true };
  worksheet.getCell("D21").font = { name: "Calibri", size: 10, italic: true };

  applyAutoColumnWidths(worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Builds Monthly Computation Excel Workbook matching exact schema from TEMP COMPUTATION.xlsx:
 * Sr. No. | EMPLOYEE ID | EMPLOYEE NAME | LOCATION | JOINING DATE | END DATE | BASIC | GROSS SALARY | N0. OF MONTHS | TOTAL GROSS SALARY | NSSF(5.5%) | NSSF(13%) | TOTAL PAY COST | TOTAL TAXABLE AMOUNT | INCOME TAX | TOTAL DEDUCTION | NET PAY
 * Includes decorated totals row, Excel formulas, and a statistical summary block.
 */
export async function buildMonthlyComputationWorkbook(
  staffRecords: any[],
  monthStr: string = "August 2026"
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DVLA Temporary Staff HR Platform";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("MONTHLY COMPUTATION");

  // Title Banner Row 1
  worksheet.mergeCells("A1:Q1");
  const title1 = worksheet.getCell("A1");
  title1.value = "DRIVER AND VEHICLE LICENSING AUTHORITY (DVLA)";
  title1.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  title1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.headerBg } };
  title1.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 34;

  // Title Banner Row 2
  worksheet.mergeCells("A2:Q2");
  const title2 = worksheet.getCell("A2");
  title2.value = `MONTHLY PAYROLL COMPUTATION REPORT - ${monthStr.toUpperCase()}`;
  title2.font = { name: "Calibri", size: 11, bold: true, color: { argb: GREEN_THEME.subHeaderFont } };
  title2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.subHeaderBg } };
  title2.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 24;

  // Blank spacing row 3
  worksheet.getRow(3).height = 10;

  // Column Headers (Row 4)
  const colHeaders = [
    "Sr. No.",
    "EMPLOYEE ID",
    "EMPLOYEE NAME",
    "LOCATION",
    "JOINING DATE",
    "END DATE",
    " BASIC",
    " GROSS SALARY",
    "N0. OF MONTHS",
    " TOTAL GROSS SALARY",
    " NSSF(5.5%)",
    "NSSF(13%)",
    "TOTAL PAY COST",
    "TOTAL TAXABLE AMOUNT",
    "INCOME TAX",
    " TOTAL DEDUCTION",
    " NET PAY",
  ];

  const headerRow = worksheet.addRow(colHeaders);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
      bottom: { style: "medium", color: { argb: GREEN_THEME.headerBg } },
      left: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
      right: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
    };
  });

  let sumBasic = 0;
  let sumGross = 0;
  let sumTotalGross = 0;
  let sumNssf55 = 0;
  let sumNssf13 = 0;
  let sumPayCost = 0;
  let sumTaxable = 0;
  let sumTax = 0;
  let sumDeductions = 0;
  let sumNetPay = 0;

  staffRecords.forEach((item, idx) => {
    const r = idx + 5; // Data rows start at row 5
    const currentContract = item.contracts?.find((c: any) => c.is_current) || item.contracts?.[0];
    
    const basic = item.salary ? Number(item.salary) : 1400.00;
    const gross = basic;
    const months = 1;
    const totalGross = gross * months;
    const nssf55 = Math.round(totalGross * 0.055 * 100) / 100;
    const nssf13 = Math.round(totalGross * 0.13 * 100) / 100;
    const payCost = Math.round((totalGross + nssf13) * 100) / 100;
    const taxable = Math.round((totalGross - nssf55) * 100) / 100;
    const incomeTax = 122.28;
    const totalDeduction = Math.round((nssf55 + incomeTax) * 100) / 100;
    const netPay = Math.round((totalGross - totalDeduction) * 100) / 100;

    sumBasic += basic;
    sumGross += gross;
    sumTotalGross += totalGross;
    sumNssf55 += nssf55;
    sumNssf13 += nssf13;
    sumPayCost += payCost;
    sumTaxable += taxable;
    sumTax += incomeTax;
    sumDeductions += totalDeduction;
    sumNetPay += netPay;

    const startDateStr = currentContract?.start_date ? formatDateReadable(currentContract.start_date) : "01/01/2026";
    const endDateStr = currentContract?.end_date ? formatDateReadable(currentContract.end_date) : "30/06/2026";

    const rowValues = [
      idx + 1,
      item.staff_code || `TEMP-${String(idx + 1).padStart(3, "0")}`,
      (item.full_name || "").toUpperCase(),
      (item.department || "HEAD OFFICE").toUpperCase(),
      startDateStr,
      endDateStr,
      basic,
      gross,
      months,
      { formula: `H${r}*I${r}`, result: totalGross },
      { formula: `J${r}*0.055`, result: nssf55 },
      { formula: `0.13*J${r}`, result: nssf13 },
      { formula: `J${r}+L${r}`, result: payCost },
      { formula: `J${r}-K${r}`, result: taxable },
      incomeTax,
      { formula: `K${r}+O${r}`, result: totalDeduction },
      { formula: `J${r}-P${r}`, result: netPay },
    ];

    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 22;
    const isAlt = idx % 2 === 1;

    dataRow.eachCell((cell, colIdx) => {
      cell.font = { name: "Calibri", size: 10 };
      cell.border = {
        top: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        bottom: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        left: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        right: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
      };

      if (isAlt) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.altRowBg } };
      }

      if ([7, 8, 10, 11, 12, 13, 14, 15, 16, 17].includes(colIdx)) {
        (cell as any).numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if ([1, 2, 5, 6, 9].includes(colIdx)) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });
  });

  const firstDataRow = 5;
  const lastDataRow = Math.max(5, staffRecords.length + 4);
  const totalsRowIndex = lastDataRow + 1;

  // Total Summary Row
  const totalsRowValues = [
    "TOTALS",
    "",
    "",
    "",
    "",
    "",
    { formula: `SUM(G${firstDataRow}:G${lastDataRow})`, result: sumBasic },
    { formula: `SUM(H${firstDataRow}:H${lastDataRow})`, result: sumGross },
    "",
    { formula: `SUM(J${firstDataRow}:J${lastDataRow})`, result: sumTotalGross },
    { formula: `J${totalsRowIndex}*0.055`, result: sumNssf55 },
    { formula: `0.13*J${totalsRowIndex}`, result: sumNssf13 },
    { formula: `J${totalsRowIndex}+L${totalsRowIndex}`, result: sumPayCost },
    { formula: `J${totalsRowIndex}-K${totalsRowIndex}`, result: sumTaxable },
    { formula: `SUM(O${firstDataRow}:O${lastDataRow})`, result: sumTax },
    { formula: `SUM(P${firstDataRow}:P${lastDataRow})`, result: sumDeductions },
    { formula: `SUM(Q${firstDataRow}:Q${lastDataRow})`, result: sumNetPay },
  ];

  const totalRow = worksheet.addRow(totalsRowValues);
  totalRow.height = 28;

  worksheet.mergeCells(`A${totalsRowIndex}:F${totalsRowIndex}`);
  const totalLabelCell = worksheet.getCell(`A${totalsRowIndex}`);
  totalLabelCell.value = "TOTALS / GRAND COMPUTATION SUMMARY";
  totalLabelCell.alignment = { horizontal: "center", vertical: "middle" };

  totalRow.eachCell((cell, colIdx) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: GREEN_THEME.totalFont } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.totalBg } };
    cell.border = {
      top: { style: "thin", color: { argb: GREEN_THEME.accentBorder } },
      bottom: { style: "double", color: { argb: GREEN_THEME.accentBorder } },
      left: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
      right: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
    };

    if ([7, 8, 10, 11, 12, 13, 14, 15, 16, 17].includes(colIdx)) {
      (cell as any).numFmt = "#,##0.00";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  // Decorative Statistical Summary Block below Totals
  const sumStartRow = totalsRowIndex + 3;
  
  worksheet.mergeCells(`B${sumStartRow}:F${sumStartRow}`);
  const sumTitle = worksheet.getCell(`B${sumStartRow}`);
  sumTitle.value = `SUMMARY STATISTICAL OVERVIEW - ${monthStr.toUpperCase()}`;
  sumTitle.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  sumTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
  sumTitle.alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getRow(sumStartRow).height = 24;

  const statItems = [
    ["Total Validated Staff Strength:", staffRecords.length, "Employees"],
    ["Total Monthly Gross Payroll:", sumTotalGross, "GH₵"],
    ["Total Employer NSSF Contribution (13%):", sumNssf13, "GH₵"],
    ["Total Employer Cost of Employment:", sumPayCost, "GH₵"],
    ["Total Net Payout to Staff Bank Accounts:", sumNetPay, "GH₵"],
  ];

  statItems.forEach((stat, sIdx) => {
    const currR = sumStartRow + 1 + sIdx;
    const rObj = worksheet.getRow(currR);
    rObj.height = 22;

    worksheet.mergeCells(`B${currR}:D${currR}`);
    const labelC = worksheet.getCell(`B${currR}`);
    labelC.value = stat[0];
    labelC.font = { name: "Calibri", size: 10, bold: true };
    labelC.alignment = { horizontal: "left", vertical: "middle" };

    const valC = worksheet.getCell(`E${currR}`);
    valC.value = stat[1];
    valC.font = { name: "Calibri", size: 10, bold: true, color: { argb: GREEN_THEME.totalFont } };
    valC.alignment = { horizontal: "right", vertical: "middle" };
    if (typeof stat[1] === "number" && sIdx > 0) {
      (valC as any).numFmt = "#,##0.00";
    }

    const unitC = worksheet.getCell(`F${currR}`);
    unitC.value = stat[2];
    unitC.font = { name: "Calibri", size: 10, italic: true };
    unitC.alignment = { horizontal: "left", vertical: "middle" };

    [labelC, valC, unitC].forEach(c => {
      c.border = {
        top: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        bottom: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        left: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
        right: { style: "thin", color: { argb: GREEN_THEME.borderColor } },
      };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_THEME.altRowBg } };
    });
  });

  // Staff Strength Reconciliation Block (Matching Rows 599-608 of MONTHLY COMPUTATION Excel)
  const reconStartRow = sumStartRow + statItems.length + 2;
  const tealBg = "FF5AA5B8"; // Teal/Blue highlight matching the screenshot

  // Calculate dynamic staff movement numbers
  const additions = staffRecords.filter(item => {
    const joining = item.contracts?.[0]?.start_date || item.created_at;
    if (!joining) return false;
    const d = new Date(joining);
    return d.getMonth() === 7 && d.getFullYear() === 2026; // August 2026
  }).length;

  const renewals = staffRecords.filter(item => {
    return item.contracts?.some((c: any) => c.renewal_number > 1);
  }).length;

  const expiredTerminated = staffRecords.filter(item => {
    return item.contracts?.some((c: any) => {
      if (c.is_terminated) return true;
      if (!c.end_date) return false;
      const eDate = new Date(c.end_date);
      return eDate.getFullYear() === 2026 && eDate.getMonth() === 7;
    }) || item.computedStatus === "Expired" || item.computedStatus === "Terminated";
  }).length;

  const validationOnHold = staffRecords.filter(item => {
    return item.payment_status === "unpaid" || item.payment_status === "hold";
  }).length;

  const juneSupplementary = staffRecords.filter(item => {
    return (item.unpaid_reason || "").toLowerCase().includes("supplementary");
  }).length;

  const totalAttrition = expiredTerminated + validationOnHold;
  const currentTotal = staffRecords.length;
  const basePrevMonth = Math.max(0, currentTotal - additions - juneSupplementary + totalAttrition);
  const totalBase = basePrevMonth + juneSupplementary;

  const targetMonthName = monthStr.split(" ")[0] || "August";
  const targetYearVal = monthStr.split(" ")[1] || "2026";

  const reconItems = [
    [`Total staff strength As At 31/07/${targetYearVal}`, basePrevMonth],
    ["Add June Supplementary", juneSupplementary],
    ["Total Staff Strength", totalBase],
    [`Additions in ${targetMonthName}`, additions],
    ["Renewal in July", renewals],
    ["Less", ""],
    [`Expired/Terminated (${targetMonthName})`, expiredTerminated],
    ["Validation on Hold", validationOnHold],
    ["Total Attrition", totalAttrition],
    [`Total Staff Strength As At 31/08/${targetYearVal}`, currentTotal],
  ];

  reconItems.forEach((rItem, rIdx) => {
    const currR = reconStartRow + rIdx;
    const rObj = worksheet.getRow(currR);
    rObj.height = 22;

    worksheet.mergeCells(`B${currR}:D${currR}`);
    const labelC = worksheet.getCell(`B${currR}`);
    labelC.value = rItem[0];
    const isHeaderOrTotal = rIdx === 2 || rIdx === 5 || rIdx === 8 || rIdx === 9;
    labelC.font = { name: "Calibri", size: 10, bold: isHeaderOrTotal, color: { argb: "FF0F172A" } };
    labelC.alignment = { horizontal: "left", vertical: "middle" };

    const valC = worksheet.getCell(`E${currR}`);
    valC.value = rItem[1];
    valC.font = { name: "Calibri", size: 10, bold: isHeaderOrTotal, color: { argb: "FF0F172A" } };
    valC.alignment = { horizontal: "right", vertical: "middle" };

    const unitC = worksheet.getCell(`F${currR}`);
    unitC.value = rItem[1] !== "" ? "Employees" : "";
    unitC.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF0F172A" } };
    unitC.alignment = { horizontal: "left", vertical: "middle" };

    [labelC, valC, unitC].forEach(c => {
      c.border = {
        top: { style: "thin", color: { argb: "FF3B8296" } },
        bottom: { style: "thin", color: { argb: "FF3B8296" } },
        left: { style: "thin", color: { argb: "FF3B8296" } },
        right: { style: "thin", color: { argb: "FF3B8296" } },
      };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: tealBg } };
    });
  });

  applyAutoColumnWidths(worksheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

