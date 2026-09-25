const XLSX = require('xlsx');

const filePath = 'c:/Users/Constance/Desktop/Work/temp/WIP TEMPORARY STAFF COMPUTATION SEPTEMBER 2026 (JOYCE) (1).xlsx';
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names in Excel file:', workbook.SheetNames);

workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n================ SHEET: ${sheetName} ================`);
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Total rows in ${sheetName}:`, rows.length);
  console.log('First 25 rows sample:');
  rows.slice(0, 25).forEach((r, idx) => console.log(`Row ${idx + 1}:`, r));
});
