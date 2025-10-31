-- Verify all file-related columns exist in nss_applications table
-- Run this to check your database structure

USE dvla_nss_portal;

-- Check all file/document columns
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dvla_nss_portal'
  AND TABLE_NAME = 'nss_applications'
  AND COLUMN_NAME IN (
    'passport_photo',
    'id_card_copy', 
    'appointment_letter',
    'certificates',
    'posting_station',
    'posting_department'
  )
ORDER BY ORDINAL_POSITION;

-- Show complete table structure
DESCRIBE nss_applications;

