# XAMPP Setup Guide for DVLA NSS Portal

## Project Structure for XAMPP

For XAMPP to work properly, you have **two options**:

### Option 1: Full Project in htdocs (Recommended for Development)

Move the entire project to XAMPP's htdocs folder:

```
C:\xampp\htdocs\nssportal\
├── api\
│   ├── applications.php
│   ├── auth.php
│   ├── config.php
│   ├── upload.php
│   └── ...
├── app\
│   └── ...
├── components\
├── uploads\
└── ...
```

**Access URLs:**
- Frontend (Next.js): `http://localhost:3000` (runs via `npm run dev`)
- Backend API: `http://localhost/api/` or `http://localhost/nssportal/api/`

### Option 2: Only API in htdocs (Current Setup - Needs Configuration)

Keep Next.js project where it is, but configure API to point to XAMPP:

**Current Location:** `C:\Users\cae\Desktop\nssportal\`

**XAMPP Setup:**
1. Copy only the `api/` folder to: `C:\xampp\htdocs\api\`
2. Copy the `uploads/` folder to: `C:\xampp\htdocs\uploads\` (or keep in project)
3. Update API URLs in frontend to use `http://localhost/api/`

---

## Recommended Setup (Option 1)

### Step 1: Move Project to XAMPP

1. **Stop XAMPP servers** (if running)

2. **Move the project:**
   ```powershell
   # Option A: Copy entire project
   Copy-Item -Path "C:\Users\cae\Desktop\nssportal" -Destination "C:\xampp\htdocs\nssportal" -Recurse
   
   # Option B: Move project (removes from desktop)
   Move-Item -Path "C:\Users\cae\Desktop\nssportal" -Destination "C:\xampp\htdocs\nssportal"
   ```

3. **Or manually:**
   - Copy `C:\Users\cae\Desktop\nssportal` folder
   - Paste into `C:\xampp\htdocs\`
   - You'll have: `C:\xampp\htdocs\nssportal\`

### Step 2: Update API URLs

If you keep the project on Desktop, update API URLs in the frontend:

**Files to update:**
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/dashboard/page.tsx`
- `app/admin/dashboard/page.tsx`
- Any other files making API calls

**Change from:**
```typescript
'http://localhost/api/...'
```

**Change to (if project in htdocs):**
```typescript
'http://localhost/nssportal/api/...'
```

**OR keep as (if only API in htdocs/api/):**
```typescript
'http://localhost/api/...'
```

### Step 3: Configure Database

The database connection is already configured in `api/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'dvla_nss_portal');
```

This should work with XAMPP's default MySQL setup.

### Step 4: Set Up Apache Virtual Host (Optional but Recommended)

Create `C:\xampp\apache\conf\extra\httpd-vhosts.conf` entry:

```apache
<VirtualHost *:80>
    DocumentRoot "C:/xampp/htdocs/nssportal"
    ServerName nssportal.local
    <Directory "C:/xampp/htdocs/nssportal">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Add to `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1    nssportal.local
```

Then access via: `http://nssportal.local/api/`

### Step 5: Test the Setup

1. **Start XAMPP:**
   - Open XAMPP Control Panel
   - Start **Apache**
   - Start **MySQL**

2. **Test API:**
   - Open: `http://localhost/api/test-connection.php`
   - Should show database connection status

3. **Test Uploads:**
   - Verify `uploads/` folder exists
   - Check permissions (should be writable)

4. **Test Frontend:**
   ```bash
   cd C:\xampp\htdocs\nssportal
   npm install
   npm run dev
   ```
   - Access: `http://localhost:3000`

---

## Current Project Location Setup

If you want to **keep the project on Desktop** and only move API:

### Setup:

1. **Copy API folder:**
   ```
   C:\Users\cae\Desktop\nssportal\api\
   ↓ Copy to
   C:\xampp\htdocs\api\
   ```

2. **Copy uploads folder:**
   ```
   C:\Users\cae\Desktop\nssportal\uploads\
   ↓ Copy to
   C:\xampp\htdocs\uploads\
   ```

3. **Keep frontend on Desktop:**
   - Continue running `npm run dev` from Desktop location
   - API URLs stay as `http://localhost/api/`

4. **Test:**
   - API: `http://localhost/api/test-connection.php`
   - Frontend: `http://localhost:3000` (from Desktop)

---

## Quick Setup Script

Run this PowerShell script (as Administrator) to move project to XAMPP:

```powershell
# Stop XAMPP services first
$projectPath = "C:\Users\cae\Desktop\nssportal"
$htdocsPath = "C:\xampp\htdocs\nssportal"

# Copy project
Write-Host "Copying project to XAMPP htdocs..."
Copy-Item -Path $projectPath -Destination $htdocsPath -Recurse -Force

Write-Host "Project copied to: $htdocsPath"
Write-Host "Next steps:"
Write-Host "1. Start XAMPP Apache and MySQL"
Write-Host "2. Test API: http://localhost/nssportal/api/test-connection.php"
Write-Host "3. Run: cd $htdocsPath && npm run dev"
```

---

## Verify Setup

### Test Database Connection:
- URL: `http://localhost/api/verify-db-connection.php`
- Should return JSON with connection status

### Test API Endpoints:
- Register: `http://localhost/api/auth.php?action=register`
- Login: `http://localhost/api/auth.php?action=login`
- Applications: `http://localhost/api/applications.php?action=all`

### Check File Uploads:
- Ensure `uploads/` folder is writable
- Test upload: `http://localhost/api/upload.php?action=upload`

---

## Troubleshooting

**Issue: "404 Not Found" for API**
- Check Apache is running
- Verify project is in `C:\xampp\htdocs\`
- Check URL path is correct

**Issue: "Database connection failed"**
- Verify MySQL is running in XAMPP
- Check `api/config.php` credentials
- Test MySQL connection in phpMyAdmin

**Issue: "CORS errors"**
- Check `api/config.php` CORS settings
- Verify frontend URL matches allowed origins

**Issue: "Uploads not saving"**
- Check `uploads/` folder permissions
- Verify folder exists in correct location
- Check PHP `upload_max_filesize` in `php.ini`

---

## Recommended Approach

**For Development: Move entire project to htdocs**

This provides:
- ✅ Clean URL structure (`http://localhost/nssportal/`)
- ✅ Easy API access (`http://localhost/nssportal/api/`)
- ✅ Proper file paths for uploads
- ✅ Easier deployment later

**Files Structure After Move:**
```
C:\xampp\htdocs\nssportal\
├── api\              ← PHP API (accessible via Apache)
├── app\              ← Next.js pages
├── components\
├── uploads\          ← File uploads (accessible via Apache)
├── database\
├── package.json
└── ...
```

Access URLs:
- Frontend: `http://localhost:3000` (via `npm run dev`)
- API: `http://localhost/nssportal/api/` (via Apache)
- Or: `http://localhost/api/` (if API is directly in htdocs)

