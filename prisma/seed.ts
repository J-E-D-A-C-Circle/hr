import { PrismaClient } from "@prisma/client";
import * as path from "path";
import * as fs from "fs";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

function parseExcelDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val === "number") {
    return new Date(Math.round((val - 25569) * 86400 * 1000));
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function calculate6MonthEnd(startDate: Date): Date {
  const end = new Date(startDate.getTime());
  end.setMonth(end.getMonth() + 6);
  return end;
}

function normalizeName(name: string): string {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTokens(name: string): string[] {
  return normalizeName(name).split(" ").filter(Boolean);
}

async function main() {
  console.log("Seeding database with real staff data from TEMP JULY.xlsx and JUNE SSNIT.xlsx...");

  const filePath = path.join(__dirname, "..", "TEMP JULY.xlsx");
  const ssnitFilePath = path.join(__dirname, "..", "JUNE SSNIT.xlsx");

  if (!fs.existsSync(filePath)) {
    console.log("TEMP JULY.xlsx not found, skipping real data seed.");
    return;
  }

  // Load SSNIT & NIA lookup map from JUNE SSNIT.xlsx if exists
  const ssnitMap = new Map<string, { ssnit_no: string | null; nia_number: string | null }>();
  
  if (fs.existsSync(ssnitFilePath)) {
    const ssnitWb = XLSX.readFile(ssnitFilePath);
    const ssnitSheet = ssnitWb.Sheets[ssnitWb.SheetNames[0]];
    const ssnitRows: any[][] = XLSX.utils.sheet_to_json(ssnitSheet, { header: 1 });

    for (let i = 5; i < ssnitRows.length; i++) {
      const row = ssnitRows[i];
      if (!row || row.length < 4) continue;

      const ssnitNo = row[1] ? String(row[1]).trim() : null;
      const niaNo = row[2] ? String(row[2]).trim() : null;
      const surname = row[3] ? String(row[3]).trim() : "";
      const firstName = row[4] ? String(row[4]).trim() : "";
      const otherName = row[5] ? String(row[5]).trim() : "";

      if (!ssnitNo && !niaNo) continue;

      const val = {
        ssnit_no: ssnitNo && ssnitNo !== "N/A" ? ssnitNo : null,
        nia_number: niaNo && niaNo !== "N/A" ? niaNo : null,
      };

      const norm1 = normalizeName(`${firstName} ${otherName} ${surname}`);
      const norm2 = normalizeName(`${surname} ${firstName} ${otherName}`);
      const norm3 = normalizeName(`${firstName} ${surname} ${otherName}`);

      if (norm1) ssnitMap.set(norm1, val);
      if (norm2) ssnitMap.set(norm2, val);
      if (norm3) ssnitMap.set(norm3, val);
    }
    console.log(`Loaded ${ssnitMap.size} SSNIT & NIA lookup entries from JUNE SSNIT.xlsx`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  await prisma.contract.deleteMany();
  await prisma.staff.deleteMany();

  let insertedCount = 0;
  let ssnitAssignedCount = 0;

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1] || !row[2]) continue;

    const empId = String(row[1]).trim();
    const empName = String(row[2]).trim();
    const location = row[3] ? String(row[3]).trim() : "General Office";

    const rawStart = row[4];
    const startDate = parseExcelDate(rawStart);
    const rawEnd = row[5];
    const endDate = rawEnd ? parseExcelDate(rawEnd) : calculate6MonthEnd(startDate);

    const grossSalary = row[7] ? parseFloat(row[7]) : row[6] ? parseFloat(row[6]) : 1400.0;

    // Match SSNIT & NIA
    const normEmpName = normalizeName(empName);
    let matchedSsnitNia = ssnitMap.get(normEmpName);

    if (!matchedSsnitNia) {
      const empTokens = getTokens(empName);
      const empTokenSet = new Set(empTokens);

      for (const [key, val] of ssnitMap.entries()) {
        const keyTokens = getTokens(key);
        if (keyTokens.length === empTokens.length && keyTokens.every(t => empTokenSet.has(t))) {
          matchedSsnitNia = val;
          break;
        }
      }
    }

    if (matchedSsnitNia) ssnitAssignedCount++;

    try {
      await prisma.staff.create({
        data: {
          staff_code: empId,
          full_name: empName,
          ssnit_no: matchedSsnitNia?.ssnit_no || null,
          nia_number: matchedSsnitNia?.nia_number || null,
          role: "Temporary Staff",
          department: location,
          salary: isNaN(grossSalary) ? 1400.0 : grossSalary,
          insurance_provider: "Petra",
          insurance_policy_no: `PTR-${empId.replace(/[^a-zA-Z0-9]/g, "")}`,
          insurance_premium: 70.0,
          contracts: {
            create: {
              start_date: startDate,
              end_date: endDate,
              renewal_number: 1,
              is_current: true,
              is_terminated: false,
            },
          },
        },
      });
      insertedCount++;
    } catch (err: any) {
      console.error(`Error inserting staff ${empId} (${empName}):`, err.message);
    }
  }

  console.log(`Successfully seeded ${insertedCount} real staff records (${ssnitAssignedCount} with SSNIT/NIA) from TEMP JULY.xlsx & JUNE SSNIT.xlsx!`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
