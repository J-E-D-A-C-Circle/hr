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

async function main() {
  console.log("Seeding database with real staff data from TEMP JULY.xlsx...");

  const filePath = path.join(__dirname, "..", "TEMP JULY.xlsx");
  if (!fs.existsSync(filePath)) {
    console.log("TEMP JULY.xlsx not found, skipping real data seed.");
    return;
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  await prisma.contract.deleteMany();
  await prisma.staff.deleteMany();

  let insertedCount = 0;

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

    try {
      await prisma.staff.create({
        data: {
          staff_code: empId,
          full_name: empName,
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

  console.log(`Successfully seeded ${insertedCount} real staff records from TEMP JULY.xlsx!`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
