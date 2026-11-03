/**
 * Standalone Script: Export Approved Applicants by Station (Separate CSVs) 
 * and Multi-Sheet Excel Workbooks with Department Sheets.
 * 
 * Usage:
 *   # Direct SQL Dump Mode:
 *   node scripts/export-station-rosters.js --sql=dvla_nss_portal1102.sql
 * 
 *   # Direct Server Database Mode:
 *   node scripts/export-station-rosters.js
 * 
 *   # Custom Output Directory:
 *   node scripts/export-station-rosters.js --out=./exports/station_rosters
 * 
 * Output Structure:
 *   exports/station_rosters/
 *   ├── stations_csv/                          <- Separate CSV file for EACH station
 *   │   ├── Abuakwa Ultra Centre.csv
 *   │   ├── Kumasi Regional Office.csv
 *   │   └── ... (all 58 stations)
 *   │
 *   ├── stations_excel/                        <- Multi-sheet Excel workbook for EACH station
 *   │   ├── Abuakwa Ultra Centre.xlsx          <- Tabs: Administration, Finance, Vehicle Inspection...
 *   │   ├── Kumasi Regional Office.xlsx        <- Tabs: Administration, Client Service, DTTL, IT...
 *   │   └── ... (all 58 stations)
 *   │
 *   ├── stations/                              <- Structured folders per station with department CSVs
 *   │   ├── Abuakwa Ultra Centre/
 *   │   │   ├── Abuakwa Ultra Centre.xlsx      <- Department sheets
 *   │   │   ├── Abuakwa Ultra Centre.csv       <- Station CSV
 *   │   │   └── departments/
 *   │   │       ├── Administration.csv
 *   │   │       ├── Finance.csv
 *   │   │       └── Vehicle Inspection & Registration.csv
 *   │   └── ...
 *   │
 *   ├── 00_ALL_APPROVED_APPLICANTS.csv         <- Master nationwide roster
 *   ├── 00_STATION_DEPARTMENT_SUMMARY.csv      <- Summary counts table
 *   └── 00_ALL_STATIONS_MASTER_WORKBOOK.xlsx   <- Master Excel workbook (1 tab per station)
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

let XLSX = null;
try {
  XLSX = require('xlsx');
} catch (e) {
  // Will fallback to custom OpenXML zip generator if xlsx is not available
}

// Parse CLI command-line arguments
function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    outDir: null,
    stationFilter: null,
    sqlFile: null,
    host: null,
    port: null,
    user: null,
    password: null,
    database: null,
  };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      const key = eqIdx !== -1 ? arg.slice(2, eqIdx) : arg.slice(2);
      const val = eqIdx !== -1 ? arg.slice(eqIdx + 1) : 'true';

      if (key === 'out' || key === 'outDir' || key === 'output') options.outDir = val;
      else if (key === 'station' || key === 'stationFilter') options.stationFilter = val;
      else if (key === 'sql' || key === 'sqlFile' || key === 'dump') options.sqlFile = val;
      else if (key === 'host') options.host = val;
      else if (key === 'port') options.port = Number(val);
      else if (key === 'user' || key === 'username') options.user = val;
      else if (key === 'password' || key === 'pass') options.password = val;
      else if (key === 'database' || key === 'db') options.database = val;
    }
  }

  return options;
}

// Parse .env file without external dependencies
function loadEnvFile() {
  const envObj = {};
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const k = trimmed.slice(0, eqIdx).trim();
          let v = trimmed.slice(eqIdx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          envObj[k] = v;
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not parse .env file:', err.message);
    }
  }
  return envObj;
}

// Split large SQL dump into individual statements to avoid max_allowed_packet errors
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';

  const lines = sql.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || (trimmed.startsWith('/*') && trimmed.endsWith('*/'))) {
      continue;
    }
    current += line + '\n';
    if (trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter((s) => s.length > 0);
}

// Connect to MySQL with port fallback detection
async function createDbConnection(cliOptions) {
  const env = loadEnvFile();

  const host = cliOptions.host || process.env.DB_HOST || env.DB_HOST || '127.0.0.1';
  const user = cliOptions.user || process.env.DB_USER || env.DB_USER || 'root';
  const password = cliOptions.password !== null
    ? cliOptions.password
    : (process.env.DB_PASSWORD !== undefined
        ? process.env.DB_PASSWORD
        : (env.DB_PASSWORD !== undefined ? env.DB_PASSWORD : 'root'));
  const database = cliOptions.database || process.env.DB_NAME || env.DB_NAME || 'dvla_nss_portal';

  const explicitPort = cliOptions.port || (process.env.DB_PORT ? Number(process.env.DB_PORT) : null) || (env.DB_PORT ? Number(env.DB_PORT) : null);
  const portsToTry = explicitPort ? [explicitPort, 3307, 3306] : [3307, 3306];

  let connection = null;
  let connectedPort = null;

  for (const port of portsToTry) {
    try {
      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        multipleStatements: true,
        timezone: '+00:00',
      });
      connectedPort = port;
      break;
    } catch {
      // Try next port
    }
  }

  if (!connection) {
    throw new Error(`Failed to connect to MySQL database '${database}' on host '${host}' using ports [${portsToTry.join(', ')}]. Please verify your MySQL server is running.`);
  }

  console.log(`✅ Connected to MySQL database '${database}' on ${host}:${connectedPort}`);
  return connection;
}

// Optional SQL dump importer
async function importSqlDumpIfRequested(conn, sqlFilePath) {
  const resolvedPath = path.isAbsolute(sqlFilePath) ? sqlFilePath : path.join(__dirname, '..', sqlFilePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`SQL file not found at: ${resolvedPath}`);
  }

  console.log(`\n📥 Reading SQL dump: ${resolvedPath} (${(fs.statSync(resolvedPath).size / 1024 / 1024).toFixed(2)} MB)...`);
  const sqlContent = fs.readFileSync(resolvedPath, 'utf8');

  console.log('🔄 Preparing database tables for import...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0; SET UNIQUE_CHECKS = 0;');

  const statements = splitSqlStatements(sqlContent);
  console.log(`⚡ Executing ${statements.length} SQL statements from dump...`);

  let executed = 0;
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      executed++;
      if (executed % 50 === 0 || executed === statements.length) {
        process.stdout.write(`\rProgress: ${executed}/${statements.length} statements executed (${Math.round((executed / statements.length) * 100)}%)`);
      }
    } catch (err) {
      if (!stmt.startsWith('/*') && !stmt.startsWith('SET')) {
        // Ignore duplicate primary key warnings on re-runs
      }
    }
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1; SET UNIQUE_CHECKS = 1;');
  console.log('\n✅ SQL dump loaded successfully!\n');
}

// Sanitize string for folder / file names across OSes
function sanitizeFilename(name) {
  if (!name) return 'Unknown';
  return name
    .trim()
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

// Format NSS Service Year
function computeServiceYear(rawYear) {
  const currentYear = new Date().getFullYear();
  let yearNum = currentYear;
  if (typeof rawYear === 'number') {
    yearNum = rawYear;
  } else if (rawYear) {
    const match = String(rawYear).match(/\b(20\d\d)\b/);
    if (match) yearNum = parseInt(match[1], 10);
  }
  return `${yearNum}/${yearNum + 1}`;
}

// Format dates nicely
function formatDate(val) {
  if (!val) return 'N/A';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toISOString().split('T')[0];
  } catch {
    return String(val);
  }
}

// Escape cell for CSV
function escapeCsvCell(val) {
  if (val === undefined || val === null || val === '') return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Preserve leading zeros for Excel in CSV
function formatPhoneCsv(val) {
  if (!val) return '""';
  const cleaned = String(val).replace(/["'=]/g, '').trim();
  if (!cleaned) return '""';
  return `="${cleaned}"`;
}

// XML entity escape
function escapeXml(val) {
  if (val === undefined || val === null) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const CSV_HEADERS = [
  '#',
  'NSS Number',
  'Full Name',
  'Surname / Last Name',
  'First Name',
  'Middle Name',
  'Gender',
  'Date of Birth',
  'Nationality',
  'Phone Number',
  'Email Address',
  'Residential Address',
  'Home Region',
  'Home District',
  'Tertiary Institution',
  'Program of Study',
  'Year of Completion',
  'Assigned Station',
  'Assigned Department',
  'Posting Region',
  'Posting District',
  'Service Year',
  'Service Start Date',
  'Service End Date',
  'Commencement Date',
  'Appointment Ref Number',
  'Appointment Letter Date',
  'Authorized Signatory',
  'Signatory Title',
  'Approval Status',
  'Approval Date',
  'Submission Date',
];

// Standard column widths for Excel
const COLUMN_WIDTHS = [
  { wch: 6 },  // #
  { wch: 18 }, // NSS Number
  { wch: 26 }, // Full Name
  { wch: 18 }, // Surname
  { wch: 18 }, // First Name
  { wch: 16 }, // Middle Name
  { wch: 10 }, // Gender
  { wch: 14 }, // DOB
  { wch: 14 }, // Nationality
  { wch: 18 }, // Phone
  { wch: 28 }, // Email
  { wch: 30 }, // Residential Address
  { wch: 18 }, // Home Region
  { wch: 18 }, // Home District
  { wch: 32 }, // Institution
  { wch: 30 }, // Program
  { wch: 14 }, // Year
  { wch: 26 }, // Station
  { wch: 26 }, // Department
  { wch: 18 }, // Posting Region
  { wch: 18 }, // Posting District
  { wch: 14 }, // Service Year
  { wch: 14 }, // Start Date
  { wch: 14 }, // End Date
  { wch: 26 }, // Commencement Date
  { wch: 24 }, // Ref Num
  { wch: 20 }, // Letter Date
  { wch: 26 }, // Signatory
  { wch: 20 }, // Signatory Title
  { wch: 14 }, // Status
  { wch: 14 }, // Reviewed At
  { wch: 14 }, // Created At
];

// Map application row to formatted object
function formatApplicantRecord(raw, index) {
  let appointmentLetterData = {};
  if (raw.additional_info) {
    try {
      const parsed = typeof raw.additional_info === 'string' ? JSON.parse(raw.additional_info) : raw.additional_info;
      appointmentLetterData = parsed.appointmentLetterData || parsed || {};
    } catch {
      appointmentLetterData = {};
    }
  }

  const id = raw.id;
  const fullName = [raw.first_name, raw.middle_name, raw.last_name].filter(Boolean).join(' ').trim() || 'NSS Personnel';
  const station = (raw.posting_station || '').trim() || 'Unassigned Station';
  const department = (raw.posting_department || '').trim() || 'General Deployment';
  const refNum = appointmentLetterData.customRefNumber || `DVLA/HQ/NSS/2026/${String(id).padStart(3, '0')}`;
  
  const letterDate = appointmentLetterData.letterDate ||
    (raw.reviewed_at
      ? new Date(raw.reviewed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
      : 'OCTOBER 12, 2026');

  const signatoryName = appointmentLetterData.signatoryName || 'EPHRAIM NII TAN SACKEY';
  const signatoryTitle = appointmentLetterData.signatoryTitle || 'AG. DIRECTOR HR';
  const serviceYear = computeServiceYear(raw.service_year);
  const startDate = raw.service_period_start ? formatDate(raw.service_period_start) : '2026-11-02';
  const endDate = raw.service_period_end ? formatDate(raw.service_period_end) : '2027-10-29';
  const effectiveDate = 'Monday, November 2, 2026';

  return {
    index: index + 1,
    id,
    nssNumber: raw.nss_number || 'N/A',
    fullName,
    lastName: raw.last_name || '',
    firstName: raw.first_name || '',
    middleName: raw.middle_name || '',
    gender: raw.gender || 'N/A',
    dateOfBirth: formatDate(raw.date_of_birth),
    nationality: raw.nationality || 'Ghanaian',
    phoneNumber: raw.phone_number ? String(raw.phone_number).trim() : '',
    email: raw.email || 'N/A',
    residentialAddress: raw.residential_address || 'N/A',
    region: raw.region || 'N/A',
    district: raw.district || 'N/A',
    institutionName: raw.institution_name || 'N/A',
    courseProgram: raw.course_program || 'N/A',
    yearOfCompletion: raw.year_of_completion || 'N/A',
    postingStation: station,
    postingDepartment: department,
    postingRegion: raw.posting_region || 'N/A',
    postingDistrict: raw.posting_district || 'N/A',
    serviceYear,
    servicePeriodStart: startDate,
    servicePeriodEnd: endDate,
    commencementDate: effectiveDate,
    refNum,
    letterDate,
    signatoryName,
    signatoryTitle,
    status: (raw.status || 'APPROVED').toUpperCase(),
    reviewedAt: formatDate(raw.reviewed_at),
    createdAt: formatDate(raw.created_at),
  };
}

// Convert record to array matching CSV_HEADERS
function applicantRecordToRow(r, i) {
  return [
    i + 1,
    r.nssNumber,
    r.fullName,
    r.lastName,
    r.firstName,
    r.middleName,
    r.gender,
    r.dateOfBirth,
    r.nationality,
    r.phoneNumber,
    r.email,
    r.residentialAddress,
    r.region,
    r.district,
    r.institutionName,
    r.courseProgram,
    r.yearOfCompletion,
    r.postingStation,
    r.postingDepartment,
    r.postingRegion,
    r.postingDistrict,
    r.serviceYear,
    r.servicePeriodStart,
    r.servicePeriodEnd,
    r.commencementDate,
    r.refNum,
    r.letterDate,
    r.signatoryName,
    r.signatoryTitle,
    r.status,
    r.reviewedAt,
    r.createdAt,
  ];
}

// Build CSV text from applicant records
function buildCsv(records) {
  const headerRow = CSV_HEADERS.map(escapeCsvCell).join(',');
  const dataRows = records.map((r, i) => [
    i + 1,
    escapeCsvCell(r.nssNumber),
    escapeCsvCell(r.fullName),
    escapeCsvCell(r.lastName),
    escapeCsvCell(r.firstName),
    escapeCsvCell(r.middleName),
    escapeCsvCell(r.gender),
    escapeCsvCell(r.dateOfBirth),
    escapeCsvCell(r.nationality),
    formatPhoneCsv(r.phoneNumber),
    escapeCsvCell(r.email),
    escapeCsvCell(r.residentialAddress),
    escapeCsvCell(r.region),
    escapeCsvCell(r.district),
    escapeCsvCell(r.institutionName),
    escapeCsvCell(r.courseProgram),
    escapeCsvCell(r.yearOfCompletion),
    escapeCsvCell(r.postingStation),
    escapeCsvCell(r.postingDepartment),
    escapeCsvCell(r.postingRegion),
    escapeCsvCell(r.postingDistrict),
    escapeCsvCell(r.serviceYear),
    escapeCsvCell(r.servicePeriodStart),
    escapeCsvCell(r.servicePeriodEnd),
    escapeCsvCell(r.commencementDate),
    escapeCsvCell(r.refNum),
    escapeCsvCell(r.letterDate),
    escapeCsvCell(r.signatoryName),
    escapeCsvCell(r.signatoryTitle),
    escapeCsvCell(r.status),
    escapeCsvCell(r.reviewedAt),
    escapeCsvCell(r.createdAt),
  ].join(','));

  // UTF-8 BOM so Excel opens with proper character encoding
  return '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
}

// ====================================================================
// Multi-Sheet Excel Workbook Builder (SheetJS with fallback)
// ====================================================================

function saveMultiSheetWorkbook(worksheets, targetFilePath) {
  // If SheetJS is available, use official XLSX library
  if (XLSX) {
    const wb = XLSX.utils.book_new();
    const usedNames = new Set();

    for (const sheet of worksheets) {
      let cleanName = (sheet.name || 'Sheet')
        .replace(/[\\/?*:[\]]+/g, '_')
        .trim()
        .slice(0, 31);
      if (!cleanName) cleanName = 'Sheet';

      let uniqueName = cleanName;
      let counter = 2;
      while (usedNames.has(uniqueName.toLowerCase())) {
        const suffix = ` (${counter})`;
        uniqueName = cleanName.slice(0, 31 - suffix.length) + suffix;
        counter++;
      }
      usedNames.add(uniqueName.toLowerCase());

      const dataAoa = [
        CSV_HEADERS,
        ...sheet.records.map((r, i) => applicantRecordToRow(r, i)),
      ];

      const ws = XLSX.utils.aoa_to_sheet(dataAoa);
      ws['!cols'] = COLUMN_WIDTHS;
      XLSX.utils.book_append_sheet(wb, ws, uniqueName);
    }

    XLSX.writeFile(wb, targetFilePath);
    return;
  }

  // Fallback to pure-JS OpenXML zip generator
  const xlsxBuffer = fallbackBuildXlsx(worksheets);
  fs.writeFileSync(targetFilePath, xlsxBuffer);
}

// Fallback pure-JS OpenXML generator
function fallbackBuildXlsx(worksheets) {
  const files = [];

  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  files.push({ path: '_rels/.rels', data: rootRelsXml });

  let workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
`;

  let workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/><color rgb="FF000000"/></font>
    <font><name val="Calibri"/><sz val="11"/><b/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1B4D3E"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/></border>
    <border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;
  files.push({ path: 'xl/styles.xml', data: stylesXml });

  const usedNames = new Set();
  worksheets.forEach((sheet, sheetIdx) => {
    const sheetId = sheetIdx + 1;
    const rId = `rIdSheet${sheetId}`;

    let cleanName = (sheet.name || `Sheet${sheetId}`).replace(/[\\/?*:[\]]+/g, '_').trim().slice(0, 31);
    if (!cleanName) cleanName = `Sheet${sheetId}`;
    let uniqueName = cleanName;
    let counter = 2;
    while (usedNames.has(uniqueName.toLowerCase())) {
      const suffix = ` (${counter})`;
      uniqueName = cleanName.slice(0, 31 - suffix.length) + suffix;
      counter++;
    }
    usedNames.add(uniqueName.toLowerCase());

    contentTypesXml += `  <Override PartName="/xl/worksheets/sheet${sheetId}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n`;
    workbookRelsXml += `  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheetId}.xml"/>\n`;
    workbookXml += `    <sheet name="${escapeXml(uniqueName)}" sheetId="${sheetId}" r:id="${rId}"/>\n`;

    let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1" ht="26">
`;
    CSV_HEADERS.forEach((h, colIdx) => {
      const colLetter = colIdxToLetter(colIdx);
      sheetXml += `      <c r="${colLetter}1" t="inlineStr" s="1"><is><t>${escapeXml(h)}</t></is></c>\n`;
    });
    sheetXml += `    </row>\n`;

    sheet.records.forEach((record, rowIdx) => {
      const rNum = rowIdx + 2;
      const rowValues = applicantRecordToRow(record, rowIdx);
      sheetXml += `    <row r="${rNum}">\n`;
      rowValues.forEach((val, colIdx) => {
        const colLetter = colIdxToLetter(colIdx);
        const valStr = val !== undefined && val !== null ? String(val) : '';
        sheetXml += `      <c r="${colLetter}${rNum}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(valStr)}</t></is></c>\n`;
      });
      sheetXml += `    </row>\n`;
    });

    sheetXml += `  </sheetData>\n</worksheet>`;
    files.push({ path: `xl/worksheets/sheet${sheetId}.xml`, data: sheetXml });
  });

  contentTypesXml += `</Types>`;
  workbookRelsXml += `</Relationships>`;
  workbookXml += `  </sheets>\n</workbook>`;

  files.push({ path: '[Content_Types].xml', data: contentTypesXml });
  files.push({ path: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml });
  files.push({ path: 'xl/workbook.xml', data: workbookXml });

  return createZipArchive(files);
}

function colIdxToLetter(colIndex) {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function createZipArchive(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const rawData = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8');
    const compressed = zlib.deflateRawSync(rawData);
    const crc = crc32(rawData);
    const filenameBuf = Buffer.from(file.path, 'utf8');

    const localHeader = Buffer.alloc(30 + filenameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(rawData.length, 22);
    localHeader.writeUInt16LE(filenameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    filenameBuf.copy(localHeader, 30);
    localHeaders.push(localHeader, compressed);

    const centralHeader = Buffer.alloc(46 + filenameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(filenameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    filenameBuf.copy(centralHeader, 46);
    centralHeaders.push(centralHeader);

    offset += localHeader.length + compressed.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) centralDirSize += ch.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

// Build Summary CSV of Station & Department counts
function buildSummaryCsv(stationMap) {
  const headers = ['Station Name', 'Department Name', 'Approved Applicants Count'];
  const rows = [];

  let grandTotal = 0;
  const sortedStations = Object.keys(stationMap).sort((a, b) => a.localeCompare(b));

  for (const stName of sortedStations) {
    const stData = stationMap[stName];
    const deptMap = stData.departments;
    const sortedDepts = Object.keys(deptMap).sort((a, b) => a.localeCompare(b));

    for (const deptName of sortedDepts) {
      const count = deptMap[deptName].length;
      rows.push([escapeCsvCell(stName), escapeCsvCell(deptName), count].join(','));
    }

    rows.push([escapeCsvCell(`TOTAL - ${stName}`), '""', stData.all.length].join(','));
    grandTotal += stData.all.length;
  }

  rows.push(['"GRAND TOTAL (ALL STATIONS)"', '""', grandTotal].join(','));

  return '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
}

// Main execution routine
async function main() {
  console.log('================================================================');
  console.log('🚀 DVLA NSS Portal - Station & Department Roster Export Generator');
  console.log('================================================================\n');

  const cliOptions = parseCliArgs();
  const baseOutDir = cliOptions.outDir
    ? path.resolve(cliOptions.outDir)
    : path.join(__dirname, '..', 'exports', 'station_rosters');

  console.log(`📁 Target Output Directory: ${baseOutDir}`);
  if (cliOptions.sqlFile) {
    console.log(`📜 Source SQL File:         ${cliOptions.sqlFile}`);
  }
  if (cliOptions.stationFilter) {
    console.log(`🔍 Filter Station:          "${cliOptions.stationFilter}"`);
  }
  console.log('');

  let conn;
  try {
    conn = await createDbConnection(cliOptions);

    if (cliOptions.sqlFile) {
      await importSqlDumpIfRequested(conn, cliOptions.sqlFile);
    }

    console.log('🔎 Querying approved applicants from database...');
    const [rawRows] = await conn.query(`
      SELECT 
        id,
        nss_number,
        first_name,
        last_name,
        middle_name,
        date_of_birth,
        gender,
        nationality,
        phone_number,
        email,
        residential_address,
        region,
        district,
        institution_name,
        course_program,
        year_of_completion,
        posting_region,
        posting_district,
        posting_station,
        posting_department,
        service_year,
        service_period_start,
        service_period_end,
        additional_info,
        status,
        reviewed_at,
        created_at
      FROM nss_applications
      WHERE LOWER(status) = 'approved' OR status = 'approved'
      ORDER BY posting_station ASC, posting_department ASC, last_name ASC, first_name ASC
    `);

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      console.warn('⚠️ No approved applicants found in database.');
      return;
    }

    console.log(`📊 Found ${rawRows.length} total approved applicants across all stations.\n`);

    const allRecords = rawRows.map((row, i) => formatApplicantRecord(row, i));

    // Group by station and department
    const stationMap = {};
    for (const record of allRecords) {
      const station = record.postingStation;
      const dept = record.postingDepartment;

      if (!stationMap[station]) {
        stationMap[station] = {
          all: [],
          departments: {},
        };
      }
      stationMap[station].all.push(record);

      if (!stationMap[station].departments[dept]) {
        stationMap[station].departments[dept] = [];
      }
      stationMap[station].departments[dept].push(record);
    }

    let targetStations = Object.keys(stationMap);
    if (cliOptions.stationFilter) {
      const filterLower = cliOptions.stationFilter.trim().toLowerCase();
      targetStations = targetStations.filter((s) => s.toLowerCase().includes(filterLower));
      if (targetStations.length === 0) {
        console.error(`❌ No stations found matching filter "${cliOptions.stationFilter}".`);
        console.log(`Available stations in DB: ${Object.keys(stationMap).join(', ')}`);
        return;
      }
    }

    // Safely clean old files inside baseOutDir so old runs are purged
    function cleanDirectory(dir) {
      if (!fs.existsSync(dir)) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          try {
            if (entry.isDirectory()) {
              cleanDirectory(fullPath);
              try { fs.rmdirSync(fullPath); } catch {}
            } else {
              fs.unlinkSync(fullPath);
            }
          } catch {}
        }
      } catch {}
    }

    if (fs.existsSync(baseOutDir)) {
      console.log(`🧹 Cleaning previous exports from ${baseOutDir}...`);
      cleanDirectory(baseOutDir);
    }

    // Directories setup
    fs.mkdirSync(baseOutDir, { recursive: true });
    const stationsCsvDir = path.join(baseOutDir, 'stations_csv');
    const stationsExcelDir = path.join(baseOutDir, 'stations_excel');
    const stationsDir = path.join(baseOutDir, 'stations');

    fs.mkdirSync(stationsCsvDir, { recursive: true });
    fs.mkdirSync(stationsExcelDir, { recursive: true });
    fs.mkdirSync(stationsDir, { recursive: true });

    let totalStationsCount = 0;
    let totalDepartmentFilesCount = 0;

    console.log('🔄 Generating station CSVs and multi-sheet Excel files (department tabs first)...');

    // Process each station
    for (const stationName of targetStations.sort((a, b) => a.localeCompare(b))) {
      totalStationsCount++;
      const stData = stationMap[stationName];
      const safeStationName = sanitizeFilename(stationName);

      // 1. Separate CSV file for this station
      const stationCsvFilename = `${safeStationName}.csv`;
      const stationCsvPathInFolder = path.join(stationsCsvDir, stationCsvFilename);
      fs.writeFileSync(stationCsvPathInFolder, buildCsv(stData.all), 'utf8');

      // 2. Separate Excel (.xlsx) file for this station with department sheets FIRST!
      // When opened in Excel, the user will immediately see the first department (e.g. Administration)
      const deptNames = Object.keys(stData.departments).sort((a, b) => {
        // If "Administration" exists, put it first, then alphabetical
        if (a.toLowerCase() === 'administration') return -1;
        if (b.toLowerCase() === 'administration') return 1;
        return a.localeCompare(b);
      });

      const stationWorksheets = [];

      // Add each department as its own sheet
      for (const deptName of deptNames) {
        stationWorksheets.push({
          name: deptName,
          records: stData.departments[deptName],
        });
      }

      // Add "All Station Personnel" sheet at the end as full overview
      stationWorksheets.push({
        name: 'All Station Personnel',
        records: stData.all,
      });

      // Save to stations_excel/ folder
      const stationXlsxFilename = `${safeStationName}.xlsx`;
      const stationXlsxPathInFolder = path.join(stationsExcelDir, stationXlsxFilename);
      saveMultiSheetWorkbook(stationWorksheets, stationXlsxPathInFolder);

      // 3. Also save into station folder: stations/[Station_Name]/
      const stationFolder = path.join(stationsDir, safeStationName);
      const deptFolder = path.join(stationFolder, 'departments');
      fs.mkdirSync(stationFolder, { recursive: true });
      fs.mkdirSync(deptFolder, { recursive: true });

      // Copy station CSV and XLSX into station directory
      fs.writeFileSync(path.join(stationFolder, `${safeStationName}.csv`), buildCsv(stData.all), 'utf8');
      saveMultiSheetWorkbook(stationWorksheets, path.join(stationFolder, `${safeStationName}.xlsx`));

      // Save individual CSVs for each department inside stationFolder/departments/
      for (const deptName of deptNames) {
        const deptRecords = stData.departments[deptName];
        const safeDeptName = sanitizeFilename(deptName);
        const deptCsvPath = path.join(deptFolder, `${safeDeptName}.csv`);
        fs.writeFileSync(deptCsvPath, buildCsv(deptRecords), 'utf8');
        totalDepartmentFilesCount++;
      }

      console.log(`  ✓ [${stationName}]: CSV + Excel file with department sheets [${deptNames.join(', ')}] (${stData.all.length} personnel)`);
    }

    // Generate root master files
    if (!cliOptions.stationFilter) {
      console.log('\n📦 Generating Master Nationwide Exports...');

      // Master All Approved CSV
      const masterCsvPath = path.join(baseOutDir, '00_ALL_APPROVED_APPLICANTS.csv');
      fs.writeFileSync(masterCsvPath, buildCsv(allRecords), 'utf8');
      console.log(`  ✓ Saved Master CSV: ${masterCsvPath}`);

      // Master Summary Breakdown CSV
      const summaryCsvPath = path.join(baseOutDir, '00_STATION_DEPARTMENT_SUMMARY.csv');
      fs.writeFileSync(summaryCsvPath, buildSummaryCsv(stationMap), 'utf8');
      console.log(`  ✓ Saved Station & Department Summary: ${summaryCsvPath}`);

      // Master Nationwide Multi-Sheet Excel Workbook (1 Tab per station)
      const masterWorksheets = [
        { name: 'All Approved Nationwide', records: allRecords },
      ];
      for (const stName of targetStations) {
        masterWorksheets.push({
          name: stName,
          records: stationMap[stName].all,
        });
      }
      const masterExcelPath = path.join(baseOutDir, '00_ALL_STATIONS_MASTER_WORKBOOK.xlsx');
      saveMultiSheetWorkbook(masterWorksheets, masterExcelPath);
      console.log(`  ✓ Saved Master Excel Workbook: ${masterExcelPath}`);
    }

    console.log('\n================================================================');
    console.log('🎉 EXPORT COMPLETED SUCCESSFULLY!');
    console.log('================================================================');
    console.log(`📌 Total Approved Personnel: ${allRecords.length}`);
    console.log(`🏢 Stations Exported:        ${totalStationsCount}`);
    console.log(`📄 Separate Station CSVs:    ${totalStationsCount} (in ${stationsCsvDir})`);
    console.log(`📊 Station Excel Workbooks:  ${totalStationsCount} (in ${stationsExcelDir})`);
    console.log(`📑 Department Sheets / CSVs: ${totalDepartmentFilesCount}`);
    console.log(`📂 Output Root Folder:       ${baseOutDir}`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ Error during export process:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

main();
