-- Verify all required columns exist in nss_applications table
-- Run this to check if all columns are present

USE dvla_nss_portal;

-- Show all columns in nss_applications table
SHOW COLUMNS FROM nss_applications;

-- Check specifically for posting_station and posting_department
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dvla_nss_portal'
  AND TABLE_NAME = 'nss_applications'
  AND COLUMN_NAME IN ('posting_station', 'posting_department');

