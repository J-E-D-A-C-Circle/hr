const XLSX = require('xlsx');

const wb = XLSX.readFile('c:/Users/Constance/Desktop/Work/temp/WIP TEMPORARY STAFF COMPUTATION SEPTEMBER 2026 (JOYCE) (1).xlsx');

['PAYE- SEPT. 2026', 'GRA- PORTAL', 'Sal Reg. Sept. 2026'].forEach((sheetName) => {
  console.log(`\n================ SHEET: ${sheetName} ================`);
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  rows.slice(0, 15).forEach((r, idx) => console.log(`Row ${idx + 1}:`, r));
});
