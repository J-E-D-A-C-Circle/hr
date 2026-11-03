# Standalone Station & Department Roster Export Guide

This standalone script connects directly to the MySQL database or reads a `.sql` dump file and exports all approved NSS applicants:
1. **Split by stations into separate CSV files** (`stations_csv/`)
2. **Split by stations into separate Excel files where each file has department sheets** (`stations_excel/`)
3. **Structured per-station folders with individual department CSVs** (`stations/`)

You can run this script directly on your server **without updating, redeploying, or restarting your running web application**.

---

## 🚀 Quick Execution Modes

### 1. Direct Server Database Mode
Runs against the live database configured in `.env` (or environment variables) without touching application code:

```bash
# Using Node:
node scripts/export-station-rosters.js

# Or using npm:
npm run export-rosters

# Or using Bun:
bun run scripts/export-station-rosters.js
```

### 2. SQL Dump File Mode (`dvla_nss_portal1102.sql`)
Automatically imports and synchronizes the SQL dump before generating exports:

```bash
node scripts/export-station-rosters.js --sql=dvla_nss_portal1102.sql
```

---

## 📂 Output Folder Structure

All generated roster files are saved inside `./exports/station_rosters/`:

```text
exports/station_rosters/
│
├── stations_csv/                          <- 1. Separate CSV file for EACH station
│   ├── Kumasi Regional Office.csv         <- All 114 approved personnel at Kumasi
│   ├── Head Office - cantonments.csv      <- All 91 approved personnel at Head Office
│   ├── Adenta District Office.csv         <- All 56 approved personnel at Adenta
│   ├── Cape Coast Regional Office.csv     <- All 38 approved personnel at Cape Coast
│   └── ... (58 individual CSV files, one for each station)
│
├── stations_excel/                        <- 2. Excel (.xlsx) file for EACH station with department sheets
│   ├── Kumasi Regional Office.xlsx        <- Sheets: All Personnel, Administration, IT, Finance, DTTL...
│   ├── Head Office - cantonments.xlsx     <- Sheets: All Personnel, HR, Audit, Corporate Affairs, Legal...
│   ├── Adenta District Office.xlsx        <- Sheets: All Personnel, Administration, Compliance, IT...
│   └── ... (58 multi-sheet Excel workbooks, one for each station)
│
├── stations/                              <- 3. Detailed per-station folders with departments subfolder
│   ├── Kumasi Regional Office/
│   │   ├── Kumasi Regional Office_All_Approved.csv
│   │   ├── Kumasi Regional Office_Departments.xlsx
│   │   └── departments/
│   │       ├── Administration.csv
│   │       ├── Client Service.csv
│   │       ├── Corporate Affairs.csv
│   │       ├── DTTL.csv
│   │       ├── Finance.csv
│   │       ├── Information Technology.csv
│   │       ├── Middle Zone Secretariat.csv
│   │       ├── Stores.csv
│   │       └── Vehicle Inspection & Registration.csv
│   │
│   ├── Head Office - cantonments/
│   │   ├── Head Office - cantonments_All_Approved.csv
│   │   ├── Head Office - cantonments_Departments.xlsx
│   │   └── departments/
│   │       ├── Administration.csv
│   │       ├── Audit.csv
│   │       ├── Corporate Affairs.csv
│   │       ├── DTTL.csv
│   │       ├── Finance.csv
│   │       ├── Human Resource.csv
│   │       ├── Information Technology.csv
│   │       ├── Legal.csv
│   │       ├── PME.csv
│   │       ├── Procurement.csv
│   │       ├── RBDI.csv
│   │       ├── Service Excellence.csv
│   │       └── Vehicle Inspection & Registration.csv
│   │
│   └── ... (folders for all 58 stations across Ghana)
│
├── 00_ALL_APPROVED_APPLICANTS.csv         <- Master nationwide roster (764 approved applicants)
├── 00_STATION_DEPARTMENT_SUMMARY.csv      <- Summary breakdown of applicant counts by station & department
└── 00_ALL_STATIONS_MASTER_WORKBOOK.xlsx   <- Master nationwide Excel workbook (1 tab per station)
```

---

## ⚙️ Available Command-Line Flags

| Flag | Description | Example |
| :--- | :--- | :--- |
| `--sql=<path>` | Import from a `.sql` dump file before exporting | `node scripts/export-station-rosters.js --sql=dvla_nss_portal1102.sql` |
| `--out=<path>` | Specify custom output folder | `node scripts/export-station-rosters.js --out=/var/www/exports` |
| `--station="<name>"` | Filter and export only a specific station | `node scripts/export-station-rosters.js --station="Kumasi Regional Office"` |
| `--host=<host>` | Override database host | `node scripts/export-station-rosters.js --host=127.0.0.1` |
| `--port=<port>` | Override database port | `node scripts/export-station-rosters.js --port=3306` |
| `--user=<user>` | Override database user | `node scripts/export-station-rosters.js --user=root` |
| `--password=<pass>` | Override database password | `node scripts/export-station-rosters.js --password=mysecret` |
| `--database=<name>` | Override database name | `node scripts/export-station-rosters.js --database=dvla_nss_portal` |

---

## 📋 Included Columns in Every Sheet

Every exported CSV and Excel sheet contains the complete standard roster headers:

1. `#` (Row sequence number)
2. `NSS Number`
3. `Full Name`
4. `Surname / Last Name`
5. `First Name`
6. `Middle Name`
7. `Gender`
8. `Date of Birth`
9. `Nationality`
10. `Phone Number` *(Formatted as string / `="024XXXXXXX"` so Microsoft Excel preserves the leading zero without stripping)*
11. `Email Address`
12. `Residential Address`
13. `Home Region`
14. `Home District`
15. `Tertiary Institution`
16. `Program of Study`
17. `Year of Completion`
18. `Assigned Station`
19. `Assigned Department`
20. `Posting Region`
21. `Posting District`
22. `Service Year` (e.g. `2026/2027`)
23. `Service Start Date` (e.g. `2026-11-02`)
24. `Service End Date` (e.g. `2027-10-29`)
25. `Commencement Date` (`Monday, November 2, 2026`)
26. `Appointment Ref Number` (Official reference, e.g. `DVLA/HQ/NSS/2026/001`)
27. `Appointment Letter Date`
28. `Authorized Signatory` (`EPHRAIM NII TAN SACKEY`)
29. `Signatory Title` (`AG. DIRECTOR HR`)
30. `Approval Status` (`APPROVED`)
31. `Approval Date`
32. `Submission Date`

---

## 🔒 Security & Git Notice

The `/exports/` directory is automatically ignored in `.gitignore` so generated applicant files containing contact information and personal details will never be accidentally committed to the Git repository.
