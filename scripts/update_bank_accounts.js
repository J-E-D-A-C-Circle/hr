const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ACH Bank details mapping from provided image table
const ACH_BANK_DIRECTORY = {
  '02': 'STANDARD CHARTERED',
  '03': 'ABSA',
  '04': 'GCB',
  '05': 'NIB',
  '06': 'UBA',
  '07': 'RURAL BANKS',
  '08': 'ADB',
  '09': 'SOCIETE GENERAL',
  '10': 'UMB',
  '11': 'HFC/REPUBLIC',
  '12': 'ZENITH',
  '13': 'ECOBANK',
  '14': 'CAL',
  '17': 'FIRST ATLANTIC',
  '18': 'PRUDENTIAL',
  '19': 'STANBIC',
  '20': 'FBN',
  '21': 'BANK OF AFRICA',
  '23': 'GT',
  '24': 'FIDELITY',
  '28': 'ACCESS BANK',
  '33': 'FIRST NATIONAL BANK',
  '34': 'CBG',
};

/**
 * Normalizes a name string into an array of uppercase alphabetical tokens.
 */
function normalizeNameTokens(nameStr) {
  return (nameStr || '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Normalizes staff code for alphanumeric comparison (e.g. "TEMP-982" -> "TEMP982").
 */
function normalizeStaffCode(codeStr) {
  return (codeStr || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

async function updateBankAccountsAndNames() {
  console.log('=== STARTING BANK NAME & ACCOUNT IMPORT & UPDATE ===\n');

  // 1. Load Excel File
  const filePath = path.join(__dirname, '..', 'CORRECTED JULY.xlsx');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found at path: ${filePath}`);
  }

  console.log(`Reading dataset from: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

  console.log(`Total rows in Excel sheet: ${rows.length}`);

  // 2. Parse Excel Rows
  // r[5] = ATTRIBUTE1 (Staff Code)
  // r[6] = ATTRIBUTE2 (Name)
  // r[7] = ATTRIBUTE3 (Bank Code)
  // r[8] = ATTRIBUTE4 (Location / Branch Code)
  // r[9] = ATTRIBUTE5 (Bank Account Number)
  const excelEntries = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    const code = r[5] ? String(r[5]).trim() : '';
    const name = r[6] ? String(r[6]).trim() : '';
    const attr3Raw = r[7] ? String(r[7]).trim() : '';
    const attr4Raw = r[8] ? String(r[8]).trim() : '';
    const bankAcc = r[9] ? String(r[9]).trim() : '';

    // Ignore header row or rows without bank account number
    if (!bankAcc || bankAcc === 'ATTRIBUTE5' || bankAcc === 'ATTRIBUTE_5') continue;

    const attr3Clean = attr3Raw.replace(/[^0-9]/g, '').padStart(2, '0');
    const attr4Clean = attr4Raw.replace(/[^0-9]/g, '');
    const bankCodeKey = attr3Clean.length === 2 ? attr3Clean : (attr4Clean.length >= 2 ? attr4Clean.substring(0, 2) : '');

    const bankName = ACH_BANK_DIRECTORY[bankCodeKey] || null;
    const bankBranch = attr4Clean || null;

    const tokens = normalizeNameTokens(name);
    const tokenKey = [...tokens].sort().join(' ');
    const codeNorm = normalizeStaffCode(code);

    excelEntries.push({
      rowIndex: i,
      code,
      codeNorm,
      name,
      bankAcc,
      bankName,
      bankBranch,
      bankCodeKey,
      tokens,
      tokenKey,
    });
  }

  console.log(`Parsed ${excelEntries.length} valid bank entries from Excel.\n`);

  // 3. Fetch Database Staff Records
  const allStaff = await prisma.staff.findMany({
    select: {
      id: true,
      staff_code: true,
      full_name: true,
      bank_name: true,
      bank_branch: true,
      bank_account: true,
    },
  });

  console.log(`Database currently contains ${allStaff.length} staff records.`);

  // Skip update if bank details are already populated and FORCE_UPDATE is not set
  const populatedCount = await prisma.staff.count({
    where: { NOT: { bank_account: null } },
  });

  if (populatedCount > 0 && process.env.FORCE_UPDATE !== "true") {
    console.log(`Database already has ${populatedCount} staff records with bank details. Skipping automatic bank update script to preserve user edits.`);
    return;
  }

  let updatedByCodeCount = 0;
  let updatedByNameCount = 0;
  let bankNameMappedCount = 0;
  let unmatchedCount = 0;

  // 4. Map & Update Staff Bank Accounts & Bank Names
  for (const staff of allStaff) {
    const staffCodeNorm = normalizeStaffCode(staff.staff_code);
    const staffTokens = normalizeNameTokens(staff.full_name);
    const staffTokenKey = [...staffTokens].sort().join(' ');

    let match = null;

    // Strategy 1: Exact staff code match (e.g., "TEMP-982")
    if (staffCodeNorm) {
      match = excelEntries.find(e => e.codeNorm && e.codeNorm === staffCodeNorm);
    }

    // Strategy 2: Exact sorted token name match
    if (!match && staffTokenKey) {
      match = excelEntries.find(e => e.tokenKey === staffTokenKey);
    }

    // Strategy 3: Token subset match
    if (!match && staffTokens.length >= 2) {
      match = excelEntries.find(e => {
        const common = staffTokens.filter(t => e.tokens.includes(t));
        return common.length >= Math.min(staffTokens.length, e.tokens.length) && common.length >= 2;
      });
    }

    if (match) {
      const matchType = match.codeNorm && match.codeNorm === staffCodeNorm ? 'code' : 'name';
      
      // Perform DB update with bank_account, bank_name, and bank_branch
      await prisma.staff.update({
        where: { id: staff.id },
        data: {
          bank_account: match.bankAcc,
          bank_name: match.bankName,
          bank_branch: match.bankBranch,
        },
      });

      if (match.bankName) {
        bankNameMappedCount++;
      }

      if (matchType === 'code') {
        updatedByCodeCount++;
      } else {
        updatedByNameCount++;
      }
    } else {
      unmatchedCount++;
      console.log(`[UNMATCHED] ID ${staff.id} | Code: ${staff.staff_code || 'N/A'} | Name: ${staff.full_name}`);
    }
  }

  console.log('\n=== UPDATE SUMMARY ===');
  console.log(`- Bank details updated by Staff Code match:  ${updatedByCodeCount}`);
  console.log(`- Bank details updated by Name match:        ${updatedByNameCount}`);
  console.log(`- Total Staff records updated:                ${updatedByCodeCount + updatedByNameCount}`);
  console.log(`- Staff records mapped with Bank Names:      ${bankNameMappedCount}`);
  console.log(`- Unmatched DB staff records:                 ${unmatchedCount}`);
  
  const totalWithBankName = await prisma.staff.count({
    where: { bank_name: { not: null } },
  });
  const totalWithBankAcc = await prisma.staff.count({
    where: { bank_account: { not: null } },
  });
  console.log(`- DB Staff records with bank names now:       ${totalWithBankName} / ${allStaff.length}`);
  console.log(`- DB Staff records with bank accounts now:    ${totalWithBankAcc} / ${allStaff.length}\n`);
}

updateBankAccountsAndNames()
  .catch((e) => {
    console.error('Error during bank data update:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
