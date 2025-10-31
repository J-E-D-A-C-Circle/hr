-- Safe check: See if columns exist before trying to add them
-- This will help you understand what's already there

USE dvla_nss_portal;

-- Check if posting_station exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Column posting_station EXISTS ✓'
        ELSE 'Column posting_station DOES NOT EXIST ✗'
    END as station_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dvla_nss_portal'
  AND TABLE_NAME = 'nss_applications'
  AND COLUMN_NAME = 'posting_station';

-- Check if posting_department exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Column posting_department EXISTS ✓'
        ELSE 'Column posting_department DOES NOT EXIST ✗'
    END as department_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dvla_nss_portal'
  AND TABLE_NAME = 'nss_applications'
  AND COLUMN_NAME = 'posting_department';

-- Show complete table structure
DESCRIBE nss_applications;

