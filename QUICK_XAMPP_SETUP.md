# Quick XAMPP Setup Guide

## ✅ Current Status

Your project is set up to use:
- **Frontend:** Next.js running on `http://localhost:3000` (from Desktop)
- **Backend API:** PHP files in XAMPP htdocs at `http://localhost/api/`

## 📁 What Needs to Be in XAMPP htdocs

**Only these folders need to be in `C:\xampp\htdocs\`:**

```
C:\xampp\htdocs\
├── api\                    ← PHP API files (MUST be here)
│   ├── applications.php
│   ├── auth.php
│   ├── config.php
│   ├── upload.php
│   └── ...
└── uploads\                ← File uploads (MUST be here)
    ├── passport\
    ├── appointment\
    ├── cv\
    └── id_card\
```

**You can keep the rest of your project on Desktop:**
```
C:\Users\cae\Desktop\nssportal\
├── app\                    ← Next.js frontend (stays here)
├── components\
├── lib\
├── package.json
└── ...
```

## 🔧 Setup Steps

### Option 1: Automatic Setup (Recommended)

Run the PowerShell script:
```powershell
cd C:\Users\cae\Desktop\nssportal
.\setup-xampp.ps1
```

### Option 2: Manual Setup

1. **Copy API folder:**
   - From: `C:\Users\cae\Desktop\nssportal\api\`
   - To: `C:\xampp\htdocs\api\`

2. **Copy uploads folder:**
   - From: `C:\Users\cae\Desktop\nssportal\uploads\`
   - To: `C:\xampp\htdocs\uploads\`

3. **Start XAMPP:**
   - Open XAMPP Control Panel
   - Start **Apache**
   - Start **MySQL**

4. **Test:**
   - API: `http://localhost/api/verify-db-connection.php`
   - Should show database connection status

## ✅ Verify Setup

### Test 1: API Connection
Visit: `http://localhost/api/verify-db-connection.php`

Expected: JSON response with connection status

### Test 2: Database Connection
Visit: `http://localhost/api/test-connection.php`

Expected: Database schema verification

### Test 3: Frontend → API
1. Start Next.js: `npm run dev` (from Desktop)
2. Open: `http://localhost:3000`
3. Try to register/login
4. Check browser console for any API errors

## 📝 Important Notes

1. **API Folder MUST be in htdocs:**
   - Current code uses: `http://localhost/api/`
   - This requires `api/` to be at: `C:\xampp\htdocs\api\`

2. **Frontend Can Stay on Desktop:**
   - Next.js runs independently via `npm run dev`
   - Only needs API to be accessible via HTTP

3. **File Uploads:**
   - `uploads/` folder should also be in htdocs
   - Or update upload paths in `api/upload.php`

4. **Database:**
   - Already configured correctly
   - Uses XAMPP's MySQL default settings

## 🔄 Updating Files

**After making changes:**

- **PHP files:** Copy updated files to `C:\xampp\htdocs\api\`
- **Frontend files:** No need to copy (stays on Desktop)
- **Uploads:** Keep synced between locations

## ⚠️ Troubleshooting

**"404 Not Found" for API:**
- Check `api/` folder exists in `C:\xampp\htdocs\`
- Verify Apache is running
- Check URL is exactly: `http://localhost/api/...`

**"CORS Error":**
- Already configured in `api/config.php`
- Should work with `http://localhost:3000`

**"Database connection failed":**
- Start MySQL in XAMPP Control Panel
- Verify database `dvla_nss_portal` exists
- Check credentials in `api/config.php`

---

## Current Setup Summary

✅ **API Location:** `C:\xampp\htdocs\api\` (accessible via `http://localhost/api/`)  
✅ **Frontend Location:** `C:\Users\cae\Desktop\nssportal\` (runs via `npm run dev`)  
✅ **Database:** XAMPP MySQL (localhost, root, no password)  
✅ **Uploads:** `C:\xampp\htdocs\uploads\` (or update paths if needed)

This hybrid setup works perfectly - frontend on Desktop, API in XAMPP!

