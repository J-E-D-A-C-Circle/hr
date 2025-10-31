-- Fix Admin User Password
-- IMPORTANT: This script requires running the PHP script first to generate a valid password hash
-- The hash in schema.sql may be a placeholder and might not work correctly
-- 
-- RECOMMENDED APPROACH:
-- 1. Open http://localhost/api/fix-admin.php in your browser (or run it via command line)
-- 2. This will generate a fresh bcrypt hash and create/update the admin user
-- 3. Then try logging in with:
--    Email: admin@dvla.gov.gh
--    Password: admin123

USE dvla_nss_portal;

-- Check current admin status
SELECT id, email, role, full_name, 
       LENGTH(password_hash) as hash_length,
       LEFT(password_hash, 7) as hash_prefix,
       CASE 
           WHEN password_hash LIKE '$2y$10$%' THEN 'BCRYPT FORMAT'
           WHEN password_hash LIKE '$2a$%' THEN 'BCRYPT (OLD FORMAT)'
           ELSE 'UNKNOWN FORMAT'
       END as hash_format
FROM users 
WHERE email = 'admin@dvla.gov.gh' AND role = 'admin';

-- If no results, the admin user doesn't exist
-- Run the fix-admin.php script to create it with a proper hash

