# XAMPP Setup Script for DVLA NSS Portal
# Run this script to copy API files to XAMPP htdocs

$htdocsPath = "C:\xampp\htdocs"
$projectPath = "C:\Users\cae\Desktop\nssportal"

Write-Host "Setting up XAMPP for DVLA NSS Portal..." -ForegroundColor Green
Write-Host ""

# Check if htdocs exists
if (-not (Test-Path $htdocsPath)) {
    Write-Host "ERROR: XAMPP htdocs folder not found at $htdocsPath" -ForegroundColor Red
    Write-Host "Please install XAMPP or update the path in this script." -ForegroundColor Yellow
    exit 1
}

# Copy API folder
Write-Host "Copying API folder..." -ForegroundColor Cyan
$apiSource = Join-Path $projectPath "api"
$apiDest = Join-Path $htdocsPath "api"

if (Test-Path $apiDest) {
    Write-Host "  Backing up existing api folder..." -ForegroundColor Yellow
    $backupPath = "$apiDest.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Move-Item $apiDest $backupPath -Force
}

Copy-Item -Path $apiSource -Destination $apiDest -Recurse -Force
Write-Host "  ✓ API folder copied to: $apiDest" -ForegroundColor Green

# Copy uploads folder
Write-Host "Copying uploads folder..." -ForegroundColor Cyan
$uploadsSource = Join-Path $projectPath "uploads"
$uploadsDest = Join-Path $htdocsPath "uploads"

if (Test-Path $uploadsDest) {
    Write-Host "  Uploads folder already exists, merging..." -ForegroundColor Yellow
    Copy-Item -Path "$uploadsSource\*" -Destination $uploadsDest -Recurse -Force
} else {
    Copy-Item -Path $uploadsSource -Destination $uploadsDest -Recurse -Force
}
Write-Host "  ✓ Uploads folder copied to: $uploadsDest" -ForegroundColor Green

Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start XAMPP Control Panel"
Write-Host "2. Start Apache and MySQL"
Write-Host "3. Test API: http://localhost/api/verify-db-connection.php"
Write-Host "4. Run Next.js: cd '$projectPath' && npm run dev"
Write-Host "5. Access frontend: http://localhost:3000"
Write-Host ""
Write-Host "API URLs will work at: http://localhost/api/" -ForegroundColor Cyan

