import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function getTokens(name: string): string[] {
  if (!name) return [];
  return name
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function getSortedTokenStr(name: string): string {
  return getTokens(name).sort().join(" ");
}

interface SsnitExcelItem {
  ssnitNo: string;
  niaNo: string | null;
  surname: string;
  firstName: string;
  fullName: string;
  file: string;
  tokens: string[];
}

async function main() {
  console.log("Starting SSNIT Numbers Update Script...");

  const staff = await prisma.staff.findMany();
  console.log(`Total staff in database: ${staff.length}`);

  const searchDirs = [
    path.join(__dirname, "..", "ssnit_files"),
    path.join(__dirname, "..", "scratch", "ssnit_zip"),
    path.join(__dirname, ".."),
    path.join(__dirname, "..", "database"),
  ];
  
  const targetFiles = [
    "DVLA_March_2026_Contract.xlsx",
    "DVLA_April_2026_Contract.xlsx",
    "DVLA_May_2026_Contract.xlsx",
    "DVLA_June_2026_Contract.xlsx",
    "SSNIT_Contribution_August_2026_2026-09-10.xlsx",
    "JUNE SSNIT.xlsx",
    "CORRECTED JULY.xlsx",
    "TEMP COMPUTATION.xlsx",
  ];

  const excelList: SsnitExcelItem[] = [];
  const excelTokenMap = new Map<string, SsnitExcelItem>();
  const excelFirstLastMap = new Map<string, SsnitExcelItem>();

  for (const f of targetFiles) {
    let filePath = "";
    for (const dir of searchDirs) {
      const candidate = path.join(dir, f);
      if (fs.existsSync(candidate)) {
        filePath = candidate;
        break;
      }
    }
    if (!filePath) {
      console.warn(`Warning: File not found: ${f}`);
      continue;
    }

    console.log(`Processing file: ${f}`);
    const wb = XLSX.readFile(filePath);
    
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rows || rows.length === 0) continue;

      // Find header row dynamically
      let headerRowIdx = -1;
      let ssnitCol = -1;
      let niaCol = -1;
      let surnameCol = -1;
      let firstNameCol = -1;
      let otherNameCol = -1;
      let fullNameCol = -1;

      for (let r = 0; r < Math.min(rows.length, 25); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;

        const ssnitIdx = row.findIndex((cell) => cell && /ssnit/i.test(String(cell)));
        if (ssnitIdx !== -1) {
          headerRowIdx = r;
          ssnitCol = ssnitIdx;
          niaCol = row.findIndex((cell) => cell && /(nia|ghana\s*card)/i.test(String(cell)));
          surnameCol = row.findIndex((cell) => cell && /surname/i.test(String(cell)));
          firstNameCol = row.findIndex((cell) => cell && /first\s*name/i.test(String(cell)));
          otherNameCol = row.findIndex((cell) => cell && /(other|middle)\s*name/i.test(String(cell)));
          fullNameCol = row.findIndex((cell) => cell && /(full\s*name|^name$|staff\s*name)/i.test(String(cell)));
          break;
        }
      }

      if (headerRowIdx === -1 || ssnitCol === -1) {
        continue;
      }

      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[ssnitCol]) continue;

        const ssnitNo = String(row[ssnitCol]).trim();
        const niaNo = niaCol !== -1 && row[niaCol] ? String(row[niaCol]).trim() : null;

        let surname = surnameCol !== -1 && row[surnameCol] ? String(row[surnameCol]).trim() : "";
        let firstName = firstNameCol !== -1 && row[firstNameCol] ? String(row[firstNameCol]).trim() : "";
        let otherName = otherNameCol !== -1 && row[otherNameCol] ? String(row[otherNameCol]).trim() : "";
        let fullName = "";

        if (surname || firstName) {
          fullName = `${surname} ${firstName} ${otherName}`.trim();
        } else if (fullNameCol !== -1 && row[fullNameCol]) {
          fullName = String(row[fullNameCol]).trim();
        }

        if (ssnitNo && ssnitNo !== "N/A" && ssnitNo !== "null" && ssnitNo !== "0" && fullName) {
          const item: SsnitExcelItem = {
            ssnitNo,
            niaNo: niaNo && niaNo !== "N/A" && niaNo !== "null" ? niaNo : null,
            surname,
            firstName,
            fullName,
            file: `${f} [${sheetName}]`,
            tokens: getTokens(fullName),
          };

          excelList.push(item);

          const sortedKey = getSortedTokenStr(fullName);
          if (!excelTokenMap.has(sortedKey)) {
            excelTokenMap.set(sortedKey, item);
          }

          const itemTokens = item.tokens;
          if (itemTokens.length >= 2) {
            const firstLastKey = `${itemTokens[0]} ${itemTokens[itemTokens.length - 1]}`;
            const lastFirstKey = `${itemTokens[itemTokens.length - 1]} ${itemTokens[0]}`;
            if (!excelFirstLastMap.has(firstLastKey)) excelFirstLastMap.set(firstLastKey, item);
            if (!excelFirstLastMap.has(lastFirstKey)) excelFirstLastMap.set(lastFirstKey, item);
          }
        }
      }
    }
  }

  console.log(`Loaded ${excelList.length} total SSNIT records across files (${excelTokenMap.size} unique token entries).`);

  let updatedCount = 0;
  let alreadySameCount = 0;
  let unmatchedCount = 0;

  for (const s of staff) {
    const sTokens = getTokens(s.full_name);
    const sortedKey = sTokens.slice().sort().join(" ");

    let matchedItem = excelTokenMap.get(sortedKey);

    // Attempt 2: First + Last token match
    if (!matchedItem && sTokens.length >= 2) {
      const flKey = `${sTokens[0]} ${sTokens[sTokens.length - 1]}`;
      const lfKey = `${sTokens[sTokens.length - 1]} ${sTokens[0]}`;
      matchedItem = excelFirstLastMap.get(flKey) || excelFirstLastMap.get(lfKey);
    }

    // Attempt 3: Token subset match
    if (!matchedItem) {
      matchedItem = excelList.find((item) => {
        if (item.tokens.length < 2 || sTokens.length < 2) return false;
        const sSet = new Set(sTokens);
        const itemSet = new Set(item.tokens);
        const itemInS = item.tokens.every((t) => sSet.has(t));
        const sInItem = sTokens.every((t) => itemSet.has(t));
        return itemInS || sInItem;
      });
    }

    if (matchedItem) {
      const needsSsnitUpdate = s.ssnit_no !== matchedItem.ssnitNo;
      const needsNiaUpdate = matchedItem.niaNo && s.nia_number !== matchedItem.niaNo;

      if (needsSsnitUpdate || needsNiaUpdate) {
        await prisma.staff.update({
          where: { id: s.id },
          data: {
            ssnit_no: matchedItem.ssnitNo,
            ...(matchedItem.niaNo ? { nia_number: matchedItem.niaNo } : {}),
          },
        });
        updatedCount++;
      } else {
        alreadySameCount++;
      }
    } else {
      unmatchedCount++;
    }
  }

  console.log(`========================================`);
  console.log(`SSNIT Update Complete!`);
  console.log(`Staff updated with new/verified SSNIT numbers: ${updatedCount}`);
  console.log(`Staff already up to date: ${alreadySameCount}`);
  console.log(`Staff unmatched: ${unmatchedCount}`);
  console.log(`========================================`);
}

main()
  .catch((err) => {
    console.error("SSNIT Update Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
