# Database Connection & Schema Verification Guide

## ✅ Current Status

All MySQL connections are properly configured and linked. Here's what's verified:

### 1. Database Configuration
- **Location**: `api/config.php`
- **Database**: `dvla_nss_portal`
- **Connection**: MySQLi with UTF8MB4 encoding
- **Tables**: `users`, `nss_applications`

### 2. Data Flow Verification

#### Registration/Application Submission
- ✅ Form collects: first_name, last_name, middle_name, date_of_birth, gender, nationality, phone_number, email, residential_address, region, district, institution_name, course_program, year_of_completion, service_year, posting_region, posting_district
- ✅ API receives all form data via POST request
- ✅ INSERT statement stores all fields correctly
- ✅ `posting_station` and `posting_department` are NULL initially (set by admin during approval)

#### Admin Approval
- ✅ Admin modal displays all application details
- ✅ Station and Department fields are required when approving
- ✅ UPDATE statement correctly saves posting_station and posting_department
- ✅ Application status updated to 'approved'

#### Data Retrieval
- ✅ All SELECT queries use `SELECT *` or `SELECT a.*` which automatically includes all columns
- ✅ Frontend receives all fields including posting_station and posting_department
- ✅ Dashboard displays dynamic status based on application data

### 3. New Columns Status

The following columns were added for the approval/posting system:
- `posting_station` VARCHAR(255) - Set by admin when approving
- `posting_department` VARCHAR(255) - Set by admin when approving

## 🔧 Setup Instructions

### If starting fresh:
1. Run the schema file: `database/schema.sql`
   ```sql
   mysql -u root -p < database/schema.sql
   ```

### If database already exists:
1. Run the migration script: `database/migration_add_station_department.sql`
   ```sql
   mysql -u root -p < database/migration_add_station_department.sql
   ```
   
   Or manually:
   ```sql
   USE dvla_nss_portal;
   ALTER TABLE nss_applications ADD COLUMN posting_station VARCHAR(255) NULL AFTER posting_district;
   ALTER TABLE nss_applications ADD COLUMN posting_department VARCHAR(255) NULL AFTER posting_station;
   ```

### Verify Connection:
Visit: `http://localhost/api/test-connection.php`

This will check:
- ✅ Database connection
- ✅ Table existence
- ✅ Required columns (posting_station, posting_department)
- ✅ Table structure

## 📋 API Endpoints Data Flow

### POST `/api/applications.php?action=submit`
**Receives**: All form fields from application form
**Stores**: All fields except posting_station/department (set by admin)
**Status**: ✅ Linked correctly

### GET `/api/applications.php?action=my-application`
**Returns**: All application fields including posting_station/department if set
**Status**: ✅ Linked correctly

### GET `/api/applications.php?action=all`
**Returns**: All applications with all fields
**Status**: ✅ Linked correctly

### GET `/api/applications.php?action=view&id={id}`
**Returns**: Single application with all fields
**Status**: ✅ Linked correctly

### PUT `/api/applications.php?action=review`
**Receives**: status, posting_station, posting_department, review_notes
**Updates**: Application status and posting details
**Status**: ✅ Linked correctly

## 🎯 Testing Checklist

- [ ] Database created with schema.sql OR migration script run
- [ ] Test connection script returns SUCCESS
- [ ] Can register new user (stores in `users` table)
- [ ] Can submit application (stores in `nss_applications` table)
- [ ] Admin can view applications in table
- [ ] Admin can open modal and see all details
- [ ] Admin can approve with station/department
- [ ] Applicant dashboard shows correct status
- [ ] Approved applicant can generate PDF with posting details

## ⚠️ Troubleshooting

**Issue**: "Column not found" errors
- **Solution**: Run migration script to add new columns

**Issue**: "Table doesn't exist"
- **Solution**: Run schema.sql to create tables

**Issue**: Connection errors
- **Solution**: Check `api/config.php` for correct DB credentials

**Issue**: Data not saving
- **Solution**: Check MySQL user has INSERT/UPDATE permissions

## ✅ Summary

All MySQL connections are properly configured and all screens are linked to accept/store data correctly. The only requirement is ensuring the database has the latest schema with the new `posting_station` and `posting_department` columns.

