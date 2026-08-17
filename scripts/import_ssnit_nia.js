const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

function normalizeName(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTokens(name) {
  return normalizeName(name).split(' ').filter(Boolean);
}

async function updateSsnitAndNia() {
  console.log('=== ENHANCED SSNIT & NIA NUMBER IMPORT ===\n');

  const filePath = path.join(__dirname, '..', 'JUNE SSNIT.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error('JUNE SSNIT.xlsx file not found at:', filePath);
    return;
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const ssnitRecords = [];
  for (let i = 5; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;

    const ssnitNo = row[1] ? String(row[1]).trim() : null;
    const niaNo = row[2] ? String(row[2]).trim() : null;
    const surname = row[3] ? String(row[3]).trim() : '';
    const firstName = row[4] ? String(row[4]).trim() : '';
    const otherName = row[5] ? String(row[5]).trim() : '';

    if (!ssnitNo && !niaNo) continue;

    const fullName1 = [firstName, otherName, surname].filter(Boolean).join(' ');
    const fullName2 = [surname, firstName, otherName].filter(Boolean).join(' ');
    const fullName3 = [firstName, surname, otherName].filter(Boolean).join(' ');

    ssnitRecords.push({
      ssnitNo: ssnitNo && ssnitNo !== 'N/A' ? ssnitNo : null,
      niaNo: niaNo && niaNo !== 'N/A' ? niaNo : null,
      surname,
      firstName,
      otherName,
      fullName1,
      norm1: normalizeName(fullName1),
      norm2: normalizeName(fullName2),
      norm3: normalizeName(fullName3),
      tokens: getTokens(`${firstName} ${otherName} ${surname}`),
      surnameNorm: normalizeName(surname),
      firstNameNorm: normalizeName(firstName),
      used: false,
    });
  }

  const dbStaff = await prisma.staff.findMany({
    select: { id: true, full_name: true, ssnit_no: true, nia_number: true, staff_code: true }
  });

  console.log(`Extracted ${ssnitRecords.length} SSNIT records. DB has ${dbStaff.length} staff records.`);

  let matchedCount = 0;
  let updatedSsnitCount = 0;
  let updatedNiaCount = 0;

  for (const staff of dbStaff) {
    const dbNorm = normalizeName(staff.full_name);
    const dbTokens = getTokens(staff.full_name);
    const dbTokenSet = new Set(dbTokens);

    let match = null;

    // Pass 1: Exact match on normalized full name variants
    match = ssnitRecords.find(r => r.norm1 === dbNorm || r.norm2 === dbNorm || r.norm3 === dbNorm);

    // Pass 2: Set equality (same words in any order)
    if (!match) {
      match = ssnitRecords.find(r => {
        if (r.tokens.length !== dbTokens.length) return false;
        return r.tokens.every(t => dbTokenSet.has(t));
      });
    }

    // Pass 3: Match 2 out of 3 tokens if surname matches
    if (!match && dbTokens.length >= 2) {
      match = ssnitRecords.find(r => {
        if (!r.surnameNorm) return false;
        const matchesSurname = dbTokenSet.has(r.surnameNorm) || r.tokens.some(t => dbTokenSet.has(t) && t.length > 3);
        if (!matchesSurname) return false;

        const commonTokens = r.tokens.filter(t => dbTokenSet.has(t));
        return commonTokens.length >= Math.min(2, dbTokens.length);
      });
    }

    // Pass 4: Substring match if name is long enough
    if (!match && dbNorm.length > 8) {
      match = ssnitRecords.find(r => {
        const commonTokens = r.tokens.filter(t => t.length > 2 && dbNorm.includes(t));
        return commonTokens.length >= 2;
      });
    }

    if (match) {
      matchedCount++;
      const updateData = {};

      if (match.ssnitNo && !staff.ssnit_no) {
        updateData.ssnit_no = match.ssnitNo;
        updatedSsnitCount++;
      }
      if (match.niaNo && !staff.nia_number) {
        updateData.nia_number = match.niaNo;
        updatedNiaCount++;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.staff.update({
          where: { id: staff.id },
          data: updateData,
        });
      }
    }
  }

  // Count final totals in DB
  const finalSsnitCount = await prisma.staff.count({ where: { NOT: { ssnit_no: null } } });
  const finalNiaCount = await prisma.staff.count({ where: { NOT: { nia_number: null } } });

  console.log('\n=== ENHANCED IMPORT SUMMARY ===');
  console.log(`- Total Staff Records Matched:       ${matchedCount} / ${dbStaff.length}`);
  console.log(`- Final Total DB Staff with SSNIT:    ${finalSsnitCount} / ${dbStaff.length}`);
  console.log(`- Final Total DB Staff with NIA:      ${finalNiaCount} / ${dbStaff.length}`);
}

updateSsnitAndNia()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
