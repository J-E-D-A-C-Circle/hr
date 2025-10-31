# Fix Admin Login Issue

The admin login is failing with a 401 Unauthorized error. This usually means either:
1. The admin user doesn't exist in the database
2. The password hash in the database is incorrect

## Solution 1: Run the PHP Fix Script (Recommended)

1. Make sure your XAMPP server is running
2. Open your browser and go to:
   ```
   http://localhost/api/fix-admin.php
   ```
   (or `http://localhost/nssportal/api/fix-admin.php` if your project is in a subfolder)

3. You should see a JSON response indicating success

4. Try logging in again with:
   - Email: `admin@dvla.gov.gh`
   - Password: `admin123`

## Solution 2: Run SQL Script in phpMyAdmin

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select the `dvla_nss_portal` database
3. Go to the SQL tab
4. Copy and paste the contents of `database/fix_admin_user.sql`
5. Click "Go" to execute
6. Verify the admin user was created/updated

## Solution 3: Manual SQL Update

If the above don't work, run this SQL query directly in phpMyAdmin:

```sql
USE dvla_nss_portal;

-- First, let's see if admin exists and what the hash looks like
SELECT id, email, role, password_hash, full_name 
FROM users 
WHERE email = 'admin@dvla.gov.gh';

-- If admin exists but login fails, delete and recreate:
DELETE FROM users WHERE email = 'admin@dvla.gov.gh' AND role = 'admin';

-- Then run the fix-admin.php script to generate a fresh hash
-- OR manually insert (but you'll need to generate a hash first using PHP)
```

## Verify Admin User

After running the fix, verify the admin exists:

```sql
SELECT id, email, role, full_name, 
       LENGTH(password_hash) as hash_length,
       LEFT(password_hash, 7) as hash_prefix
FROM users 
WHERE email = 'admin@dvla.gov.gh' AND role = 'admin';
```

The hash should:
- Be 60 characters long
- Start with `$2y$10$` (bcrypt format)

