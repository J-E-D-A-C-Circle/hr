const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseExcelDate(val) {
  if (!val) return new Date();
  if (typeof val === 'number') {
    // Excel serial number to JS Date
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    return jsDate;
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function calculate6MonthEnd(startDate) {
  const end = new Date(startDate.getTime());
  end.setMonth(end.getMonth() + 6);
  return end;
}

async function main() {
  console.log("Reading real data from TEMP JULY.xlsx...");
  const filePath = path.join(__dirname, '..', 'TEMP JULY.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Parsed ${rows.length} total rows from excel sheet.`);

  // Clean existing seed data
  await prisma.contract.deleteMany();
  await prisma.staff.deleteMany();

  let insertedCount = 0;

  // Header is row 1 (index 1), data starts from row index 2
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1] || !row[2]) continue;

    const empId = String(row[1]).trim();
    const empName = String(row[2]).trim();
    const location = row[3] ? String(row[3]).trim() : 'General Office';
    
    // Start date (col 4) & End date (col 5)
    const rawStart = row[4];
    const startDate = parseExcelDate(rawStart);
    const rawEnd = row[5];
    const endDate = rawEnd ? parseExcelDate(rawEnd) : calculate6MonthEnd(startDate);

    // Salary (col 6 or 7)
    const grossSalary = row[7] ? parseFloat(row[7]) : (row[6] ? parseFloat(row[6]) : 1400.00);

    try {
      await prisma.staff.create({
        data: {
          staff_code: empId,
          full_name: empName,
          role: 'Temporary Staff',
          department: location,
          salary: isNaN(grossSalary) ? 1400.00 : grossSalary,
          insurance_provider: 'Petra',
          insurance_policy_no: `PTR-${empId.replace(/[^a-zA-Z0-9]/g, '')}`,
          insurance_premium: 70.00, // 5% of 1400
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
    } catch (err) {
      console.error(`Failed to insert ${empId} - ${empName}:`, err.message);
    }
  }

  console.log(`Successfully populated database with ${insertedCount} real staff records from TEMP JULY.xlsx!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
