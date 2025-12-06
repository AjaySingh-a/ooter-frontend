# Script to export upload key certificate as PEM file
# Use this if you already have a keystore and just need to export the certificate

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Export Upload Key Certificate" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration - Update these if needed
$keystoreName = "upload-keystore.jks"
$alias = "upload"
$certFile = "upload_certificate.pem"

# Check if keystore exists
if (-not (Test-Path $keystoreName)) {
    Write-Host "✗ Keystore file '$keystoreName' not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please update the keystoreName variable in this script or" -ForegroundColor Yellow
    Write-Host "make sure the keystore file exists in the current directory." -ForegroundColor Yellow
    exit 1
}

# Prompt for keystore password
Write-Host "Enter the keystore password:" -ForegroundColor Yellow
$keystorePassword = Read-Host -AsSecureString
$keystorePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keystorePassword))

Write-Host ""
Write-Host "Exporting certificate as PEM file..." -ForegroundColor Green

# Export certificate as PEM
$exportArgs = @(
    "-export",
    "-rfc",
    "-keystore", $keystoreName,
    "-alias", $alias,
    "-file", $certFile,
    "-storepass", $keystorePasswordPlain
)

try {
    & keytool $exportArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Certificate exported successfully to '$certFile'!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Upload '$certFile' to Google Play Console" -ForegroundColor Yellow
        Write-Host "2. Go to: Play Console > Setup > App signing" -ForegroundColor Yellow
        Write-Host "3. Click 'Request upload key reset' and upload the PEM file" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "✗ Failed to export certificate" -ForegroundColor Red
        Write-Host "Check your keystore password and alias name" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure Java JDK is installed and 'keytool' is in your PATH" -ForegroundColor Yellow
    exit 1
}

