# Script to help update EAS credentials with new keystore
# This script will prepare everything and guide you through the process

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EAS Credentials Update Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$keystoreFile = "upload-keystore.jks"
$keystorePath = Join-Path $PSScriptRoot $keystoreFile

# Check if keystore exists
if (-not (Test-Path $keystorePath)) {
    Write-Host "✗ Error: $keystoreFile not found!" -ForegroundColor Red
    Write-Host "Make sure the keystore file exists in the project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Keystore file found: $keystorePath" -ForegroundColor Green
Write-Host ""

# Display keystore info
Write-Host "Keystore Information:" -ForegroundColor Yellow
Write-Host "  File: $keystoreFile" -ForegroundColor White
Write-Host "  Alias: upload" -ForegroundColor White
Write-Host "  Password: 9910558081Aa@" -ForegroundColor White
Write-Host "  Expected Fingerprint: 6C:89:B4:5A:A5:BC:5D:D0:8A:86:09:29:49:FA:8A:B6:46:EB:D4:3D" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EAS Credentials Update Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "EAS credentials update requires interactive input." -ForegroundColor Yellow
Write-Host "Follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Run this command:" -ForegroundColor Cyan
Write-Host "   eas credentials" -ForegroundColor White
Write-Host ""
Write-Host "2. Select platform:" -ForegroundColor Cyan
Write-Host "   → Choose: android" -ForegroundColor White
Write-Host ""
Write-Host "3. Select action:" -ForegroundColor Cyan
Write-Host "   → Choose: Update credentials" -ForegroundColor White
Write-Host ""
Write-Host "4. For Keystore:" -ForegroundColor Cyan
Write-Host "   → Choose: Upload new keystore" -ForegroundColor White
Write-Host "   → Upload file: $keystorePath" -ForegroundColor White
Write-Host "   → Enter password: 9910558081Aa@" -ForegroundColor White
Write-Host "   → Enter alias: upload" -ForegroundColor White
Write-Host ""
Write-Host "5. Complete the process and verify." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Alternative: Delete EAS Credentials" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you want EAS to use local keystore.properties instead:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Run: eas credentials" -ForegroundColor Cyan
Write-Host "2. Select: android" -ForegroundColor Cyan
Write-Host "3. Select: Remove credentials" -ForegroundColor Cyan
Write-Host "4. Confirm deletion" -ForegroundColor Cyan
Write-Host ""
Write-Host "After this, EAS will use your local keystore.properties file." -ForegroundColor Yellow
Write-Host ""

# Ask if user wants to proceed
Write-Host "Do you want to open EAS credentials now? (Y/N):" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Opening EAS credentials..." -ForegroundColor Green
    Write-Host ""
    & eas credentials
} else {
    Write-Host ""
    Write-Host "You can run 'eas credentials' manually when ready." -ForegroundColor Yellow
    Write-Host ""
}

