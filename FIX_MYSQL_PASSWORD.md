# Fix MySQL Password Issue in XAMPP

## Problem
XAMPP MySQL is rejecting the connection because root user requires a password.

## Solutions

### Solution 1: Reset Root Password to Empty (Quick Fix)

1. **Open XAMPP Control Panel**
2. **Stop MySQL** (if running)
3. **Start MySQL** again
4. **Open MySQL console:**
   - Click "Shell" button in XAMPP
   - Or run: `C:\xampp\mysql\bin\mysql.exe -u root`

5. **Reset password:**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY '';
   FLUSH PRIVILEGES;
   ```

6. **Test connection:**
   - Visit: `http://localhost/api/verify-db-connection.php`

### Solution 2: Set Password in Config (If you have a password)

If your XAMPP MySQL root has a password (commonly `root` or empty), update:

**File:** `C:\xampp\htdocs\api\config.php`

Change line 5:
```php
define('DB_PASS', '');  // If no password
// OR
define('DB_PASS', 'root');  // If password is 'root'
// OR
define('DB_PASS', 'your_password');  // Your actual password
```

### Solution 3: Check XAMPP MySQL Default Password

XAMPP default passwords:
- **No password** (empty string): `''`
- **Common password**: `root`

Try these in order:
1. Empty password (current config)
2. Password: `root`
3. Check phpMyAdmin to see if you can login there

### Solution 4: Check phpMyAdmin

1. Open: `http://localhost/phpmyadmin`
2. Try to login:
   - Username: `root`
   - Password: (leave empty or try `root`)
3. If you can login, use that password in config.php

---

## Quick Fix Script

I'll update the config file to try common XAMPP passwords automatically.

