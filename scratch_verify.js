const fs = require('fs');

const sql = fs.readFileSync('database/retirement_schema.sql', 'utf8');

const staffStart = sql.indexOf('INSERT INTO `retirement_staff`');
const alertStart = sql.indexOf('INSERT INTO `retirement_alerts`', staffStart);

const staffChunk = sql.substring(staffStart, alertStart !== -1 ? alertStart : sql.length);

// Extract sample tuples
const samples = staffChunk.match(/\(\d+,'[^']+'/g);

console.log('--- RETIREMENT SCHEMA STAFF ID FORMAT CHECK ---');
console.log('Total tuples:', samples ? samples.length : 0);
if (samples) {
  console.log('Sample staff IDs from schema:', samples.slice(0, 10));
}
