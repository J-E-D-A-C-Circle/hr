# Setting Up Uploads Folder on Windows

## Option 1: Using Windows File Explorer (Easiest)

1. Navigate to your project folder: `C:\Users\cae\Desktop\nssportal`
2. Right-click on the `uploads` folder
3. Select **Properties**
4. Go to the **Security** tab
5. Click **Edit**
6. Ensure **Users** group has:
   - **Read & execute**
   - **List folder contents**
   - **Read**
   - **Write** (important for uploads)
7. Click **Apply** and **OK**

## Option 2: Using PowerShell (Run as Administrator)

```powershell
# Navigate to your project directory
cd C:\Users\cae\Desktop\nssportal

# Give IIS_IUSRS (if using IIS) or your web server user full control
icacls uploads /grant "IIS_IUSRS:(OI)(CI)F" /T

# Or give Users group full control (for development)
icacls uploads /grant "Users:(OI)(CI)F" /T
```

## Option 3: Using Command Prompt (Run as Administrator)

```cmd
cd C:\Users\cae\Desktop\nssportal
icacls uploads /grant "Users:(OI)(CI)F" /T
```

## For XAMPP/WAMP (Apache)

If you're using XAMPP or WAMP, the web server user needs write permissions:

```powershell
# XAMPP typically uses the current user
# WAMP may use a different user
# Check your Apache error logs if uploads fail
```

## Testing File Uploads

After setting permissions:

1. Make sure the `uploads` folder exists with subdirectories:
   ```
   uploads/
   ├── passport/
   ├── appointment/
   ├── cv/
   └── id_card/
   ```

2. Test by trying to upload a file through your application
3. Check if files appear in the `uploads/{type}/{user_id}/` directory

## Troubleshooting

**If uploads fail:**
- Check Apache/PHP error logs
- Verify `uploads/` folder exists
- Ensure PHP has write permissions
- Check `php.ini` for `upload_max_filesize` and `post_max_size` (should be at least 5M)

**For XAMPP:**
- Check Apache error log: `C:\xampp\apache\logs\error.log`
- Check PHP error log: `C:\xampp\php\logs\php_error_log`

**For WAMP:**
- Check Apache error log in WAMP logs folder
- Verify Apache service is running

## Automatic Setup Script (Optional)

Create a PowerShell script to set up folders:

```powershell
# setup-uploads.ps1
$uploadDirs = @("passport", "appointment", "cv", "id_card")

foreach ($dir in $uploadDirs) {
    $path = "uploads\$dir"
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force
        Write-Host "Created: $path"
    } else {
        Write-Host "Exists: $path"
    }
}

Write-Host "Uploads folder structure ready!"
```

Run with: `.\setup-uploads.ps1`

