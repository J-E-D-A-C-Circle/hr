const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseExcelDate(val) {
  if (!val) return new Date();
  if (typeof val === 'number') {
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

function normalizeNameTokens(nameStr) {
  return (nameStr || '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

async function main() {
  console.log("Reading real data from TEMP JULY.xlsx...");
  const junePath = path.join(__dirname, '..', 'JUNE SSNIT.xlsx');
  const juneList = [];

  if (fs.existsSync(junePath)) {
    console.log("Reading JUNE SSNIT.xlsx for SSNIT & NIA number enrichment...");
    const juneWb = XLSX.readFile(junePath);
    const juneSheet = juneWb.Sheets[juneWb.SheetNames[0]];
    const juneRows = XLSX.utils.sheet_to_json(juneSheet, { header: 1 });

    for (let i = 5; i < juneRows.length; i++) {
      const r = juneRows[i];
      if (!r || !r[0] || typeof r[0] !== 'number') continue;
      const ssnitNo = r[1] ? String(r[1]).trim() : '';
      const niaNo = r[2] ? String(r[2]).trim() : '';
      const surname = r[3] ? String(r[3]).trim() : '';
      const firstName = r[4] ? String(r[4]).trim() : '';
      const otherName = r[5] ? String(r[5]).trim() : '';

      const rawFullName = [firstName, otherName, surname].filter(Boolean).join(' ');
      const tokens = normalizeNameTokens(rawFullName);
      const tokenKey = [...tokens].sort().join(' ');

      juneList.push({
        ssnitNo: ssnitNo && ssnitNo !== 'undefined' && ssnitNo !== 'N/A' ? ssnitNo : null,
        niaNo: niaNo && niaNo !== 'undefined' && niaNo !== 'N/A' ? niaNo : null,
        surname,
        firstName,
        otherName,
        rawFullName,
        tokens,
        tokenKey,
      });
    }
    console.log(`Parsed ${juneList.length} statutory records from JUNE SSNIT.xlsx.`);
  }

  const filePath = path.join(__dirname, '..', 'TEMP JULY.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Parsed ${rows.length} total rows from TEMP JULY.xlsx.`);

  const existingCount = await prisma.staff.count();
  if (existingCount > 0) {
    console.log(`Database already contains ${existingCount} staff records. Skipping seed re-import to preserve user-added staff.`);
    return;
  }

  // Clean existing seed data
  await prisma.contract.deleteMany();

  let insertedCount = 0;
  let enrichedSsnitCount = 0;
  let enrichedNiaCount = 0;

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1] || !row[2]) continue;

    const empId = String(row[1]).trim();
    const empName = String(row[2]).trim();
    const location = row[3] ? String(row[3]).trim() : 'General Office';
    
    const rawStart = row[4];
    const startDate = parseExcelDate(rawStart);
    const rawEnd = row[5];
    const endDate = rawEnd ? parseExcelDate(rawEnd) : calculate6MonthEnd(startDate);

    const grossSalary = row[7] ? parseFloat(row[7]) : (row[6] ? parseFloat(row[6]) : 1400.00);

    // Cross-match SSNIT & NIA number from June SSNIT dataset
    let matchedSsnit = null;
    let matchedNia = null;

    if (juneList.length > 0) {
      const julyTokens = normalizeNameTokens(empName);
      const julyTokenKey = [...julyTokens].sort().join(' ');

      // Priority 1: Exact sorted token match
      let match = juneList.find(j => j.tokenKey === julyTokenKey);

      // Priority 2: High subset match
      if (!match) {
        match = juneList.find(j => {
          const common = julyTokens.filter(t => j.tokens.includes(t));
          return common.length >= Math.min(julyTokens.length, j.tokens.length) && common.length >= 2;
        });
      }

      // Priority 3: First + Last token match
      if (!match && julyTokens.length >= 2) {
        const firstTok = julyTokens[0];
        const lastTok = julyTokens[julyTokens.length - 1];
        match = juneList.find(j => j.tokens.includes(firstTok) && j.tokens.includes(lastTok));
      }

      if (match) {
        matchedSsnit = match.ssnitNo;
        matchedNia = match.niaNo;
      }
    }

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
          insurance_premium: 70.00,
          ssnit_no: matchedSsnit,
          nia_number: matchedNia,
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
      if (matchedSsnit) enrichedSsnitCount++;
      if (matchedNia) enrichedNiaCount++;
    } catch (err) {
      console.error(`Failed to insert ${empId} - ${empName}:`, err.message);
    }
  }

  console.log(`Successfully populated database with ${insertedCount} real staff records from TEMP JULY.xlsx!`);
  console.log(`Enriched ${enrichedSsnitCount} records with SSNIT Numbers and ${enrichedNiaCount} records with NIA Numbers from JUNE SSNIT.xlsx.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
