const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const csvPath = "c:/Users/Constance/Desktop/Work/temp/Employee_List_AllOrg (AUG, 2026) (1).csv";

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCustomDate(dateStr) {
  if (!dateStr || dateStr === "na" || dateStr === "NA") return null;
  dateStr = dateStr.trim();

  // Format 1: D/M/YYYY or M/D/YYYY
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      let p1 = parseInt(parts[0], 10);
      let p2 = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (year < 100) year += year > 30 ? 1900 : 2000;

      let day = p1;
      let month = p2;
      if (p1 <= 12 && p2 > 12) {
        day = p2;
        month = p1;
      }
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  // Format 2: DD-MM-YY or DD-MM-YYYY
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (year < 100) year += year > 30 ? 1900 : 2000;
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function generateDeptCode(deptName) {
  if (!deptName) return "GEN-HQ";
  const cleaned = deptName.replace(/DVLA/gi, "").replace(/DO|RO/gi, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].substring(0, 4).toUpperCase();
  }
  return words.map((w) => w[0]).join("").toUpperCase() + "-HQ";
}

async function main() {
  console.log("=== DVLA Retirement Data Migration ===");
  console.log(`Reading dataset: ${csvPath}`);

  const content = fs.readFileSync(csvPath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = parseCSVLine(lines[0]);

  console.log(`Total rows in CSV: ${lines.length - 1}`);

  // 1. Process Departments & Regional Stations
  const deptMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const rawDept = row[6] || row[9] || "General Administration";
    const rawLoc = row[9] || "DVLA Head Office, Accra";
    const isStation = rawDept.includes("DO") || rawLoc.includes("DO") || rawDept.includes("RO") || rawLoc.includes("RO");
    
    if (!deptMap.has(rawDept)) {
      deptMap.set(rawDept, {
        name: rawDept,
        type: isStation ? "STATION" : "DEPARTMENT",
        location: rawLoc.replace("DVLA", "").trim() || "Accra",
      });
    }
  }

  console.log(`Extracted ${deptMap.size} unique departments/stations.`);

  const dbDeptMap = new Map();
  let deptIndex = 1;
  for (const [deptName, info] of deptMap.entries()) {
    const code = `${generateDeptCode(deptName)}-${deptIndex++}`;
    const dept = await prisma.retirementDepartment.upsert({
      where: { code },
      update: { name: info.name, type: info.type, location: info.location },
      create: {
        code,
        name: info.name,
        type: info.type,
        location: info.location,
        description: `Imported DVLA ${info.type.toLowerCase()} unit`,
      },
    });
    dbDeptMap.set(deptName, dept);
  }

  console.log("Departments synced successfully.");

  // 2. Process Staff Records
  let importedCount = 0;
  let activeCount = 0;
  let nearingCount = 0;
  let dueCount = 0;
  let retiredCount = 0;

  const now = new Date();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 5) continue;

    const initial = row[0] || "";
    const rawName = row[1] || "Staff Member";
    const fullName = initial ? `${initial} ${rawName}`.trim() : rawName.trim();
    
    const empIdRaw = row[2] || `${i}`;
    const staffId = empIdRaw.replace(/^DVLA-/i, "").trim();

    const rawGroup = row[5] || "JUNIOR LEVEL";
    const rawDeptName = row[6] || row[9] || "General Administration";
    const rawJobTitle = row[7] || "Officer";
    const rawLocName = row[9] || "DVLA Head Office";
    
    const joinDate = parseCustomDate(row[11]) || new Date("2016-06-01");
    const genderRaw = row[12] || "Male";
    const gender = genderRaw.toUpperCase().includes("FEMALE") ? "Female" : "Male";
    const dob = parseCustomDate(row[13]) || new Date("1980-01-01");
    
    const phone = row[14] || null;
    const csvStatus = row[15] || "Working";
    const email = row[16] || null;

    // Retirement calculations
    const retirementDate = new Date(dob);
    retirementDate.setFullYear(retirementDate.getFullYear() + 60);

    const diffMs = retirementDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffDays / 30.4375);
    const diffYears = Math.floor(diffMonths / 12);

    let retirementStatus = "ACTIVE";
    let isActiveMember = true;

    if (csvStatus === "Retired" || diffDays <= 0) {
      retirementStatus = "RETIRED";
      isActiveMember = false;
      retiredCount++;
    } else if (diffMonths <= 12 && csvStatus === "Working") {
      retirementStatus = "DUE_THIS_YEAR";
      dueCount++;
    } else if (diffMonths <= 60 && csvStatus === "Working") {
      retirementStatus = "NEARING_RETIREMENT";
      nearingCount++;
    } else {
      retirementStatus = "ACTIVE";
      activeCount++;
    }

    if (["Terminated", "Resigned", "Deceased"].includes(csvStatus)) {
      isActiveMember = false;
    }

    const linkedDept = dbDeptMap.get(rawDeptName);

    const staff = await prisma.retirementStaff.upsert({
      where: { staffId },
      update: {
        fullName,
        dateOfBirth: dob,
        gender,
        departmentId: linkedDept ? linkedDept.id : null,
        departmentName: rawDeptName,
        stationName: rawLocName,
        jobTitle: rawJobTitle,
        grade: rawGroup,
        dateOfFirstAppointment: joinDate,
        retirementDate,
        retirementStatus,
        email,
        phone,
        active: isActiveMember,
      },
      create: {
        staffId,
        fullName,
        dateOfBirth: dob,
        gender,
        departmentId: linkedDept ? linkedDept.id : null,
        departmentName: rawDeptName,
        stationName: rawLocName,
        jobTitle: rawJobTitle,
        grade: rawGroup,
        dateOfFirstAppointment: joinDate,
        retirementDate,
        retirementStatus,
        email,
        phone,
        active: isActiveMember,
      },
    });

    // 3. Create Milestone Alerts
    if (retirementStatus === "DUE_THIS_YEAR" || retirementStatus === "NEARING_RETIREMENT") {
      let milestone = "5_YEARS";
      if (diffMonths <= 6) milestone = "6_MONTHS";
      else if (diffMonths <= 12) milestone = "1_YEAR";
      else if (diffMonths <= 36) milestone = "3_YEARS";

      try {
        await prisma.retirementAlert.upsert({
          where: {
            staffId_milestone: { staffId: staff.id, milestone },
          },
          update: { status: "UNREAD" },
          create: {
            staffId: staff.id,
            milestone,
            status: "UNREAD",
          },
        });
      } catch (e) {
        // Ignore duplicate alert errors
      }
    }

    importedCount++;
  }

  console.log("\n==============================================");
  console.log("  IMPORT MIGRATION SUMMARY");
  console.log("==============================================");
  console.log(`Total Personnel Records Processed: ${importedCount}`);
  console.log(`Active Staff (>5 Years):           ${activeCount}`);
  console.log(`Nearing Retirement (1-5 Years):    ${nearingCount}`);
  console.log(`Due This Year (<1 Year):           ${dueCount}`);
  console.log(`Retired / Exited Archive:          ${retiredCount}`);
  console.log(`Total Regional Stations & Depts:   ${dbDeptMap.size}`);
  console.log("==============================================\n");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
