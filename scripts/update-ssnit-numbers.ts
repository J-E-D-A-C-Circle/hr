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
  ];
  
  const zipFiles = [
    "DVLA_March_2026_Contract.xlsx",
    "DVLA_April_2026_Contract.xlsx",
    "DVLA_May_2026_Contract.xlsx",
    "DVLA_June_2026_Contract.xlsx",
  ];

  const excelList: SsnitExcelItem[] = [];
  const excelTokenMap = new Map<string, SsnitExcelItem>();
  const excelFirstLastMap = new Map<string, SsnitExcelItem>();

  for (const f of zipFiles) {
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
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    for (let i = 13; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) continue;

      const ssnitNo = String(row[1]).trim();
      const niaNo = row[2] ? String(row[2]).trim() : null;
      const surname = row[4] ? String(row[4]).trim() : "";
      const firstName = row[5] ? String(row[5]).trim() : "";
      const fullName = `${surname} ${firstName}`.trim();

      if (ssnitNo && ssnitNo !== "N/A" && ssnitNo !== "null") {
        const item: SsnitExcelItem = {
          ssnitNo,
          niaNo: niaNo && niaNo !== "N/A" ? niaNo : null,
          surname,
          firstName,
          fullName,
          file: f,
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
