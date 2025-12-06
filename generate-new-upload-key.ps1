# Script to generate a new upload key for Google Play upload key reset
# This script will:
# 1. Generate a new keystore with a new upload key
# 2. Export the certificate as a PEM file for Google Play Console submission

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google Play Upload Key Reset Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$keystoreName = "upload-keystore.jks"
$alias = "upload"
$validity = 25  # 25 years validity
$keySize = 2048  # RSA key size

# Prompt for keystore password
Write-Host "Enter a password for the new keystore (keep this safe!):" -ForegroundColor Yellow
$keystorePassword = Read-Host -AsSecureString
$keystorePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keystorePassword))

# Prompt for key password (can be same as keystore password)
Write-Host ""
Write-Host "Enter a password for the key (press Enter to use same as keystore):" -ForegroundColor Yellow
$keyPasswordInput = Read-Host
if ([string]::IsNullOrWhiteSpace($keyPasswordInput)) {
    $keyPassword = $keystorePasswordPlain
} else {
    $keyPassword = $keyPasswordInput
}

# Prompt for distinguished name information
Write-Host ""
Write-Host "Enter certificate information (press Enter for defaults):" -ForegroundColor Yellow
$cn = Read-Host "Common Name (CN) [Ooter App]"
if ([string]::IsNullOrWhiteSpace($cn)) { $cn = "Ooter App" }

$ou = Read-Host "Organizational Unit (OU) [Development]"
if ([string]::IsNullOrWhiteSpace($ou)) { $ou = "Development" }

$o = Read-Host "Organization (O) [Ooter]"
if ([string]::IsNullOrWhiteSpace($o)) { $o = "Ooter" }

$l = Read-Host "City/Locality (L) []"
$st = Read-Host "State/Province (ST) []"
$c = Read-Host "Country Code (C) [US]"
if ([string]::IsNullOrWhiteSpace($c)) { $c = "US" }

# Build distinguished name
$dname = "CN=$cn, OU=$ou, O=$o"
if (![string]::IsNullOrWhiteSpace($l)) { $dname += ", L=$l" }
if (![string]::IsNullOrWhiteSpace($st)) { $dname += ", ST=$st" }
$dname += ", C=$c"

Write-Host ""
Write-Host "Generating new upload keystore..." -ForegroundColor Green

# Generate the keystore
$keytoolArgs = @(
    "-genkeypair",
    "-v",
    "-storetype", "JKS",
    "-keystore", $keystoreName,
    "-alias", $alias,
    "-keyalg", "RSA",
    "-keysize", $keySize,
    "-validity", ($validity * 365),
    "-storepass", $keystorePasswordPlain,
    "-keypass", $keyPassword,
    "-dname", $dname
)

# Generate keystore
$generateSuccess = $false
try {
    & keytool $keytoolArgs 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $generateSuccess = $true
    }
} catch {
    Write-Host "✗ Error generating keystore: $_" -ForegroundColor Red
    exit 1
}

if (-not $generateSuccess) {
    Write-Host "✗ Failed to generate keystore" -ForegroundColor Red
    Write-Host "Make sure Java JDK is installed and 'keytool' is in your PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✓ Keystore generated successfully!" -ForegroundColor Green
Write-Host ""

# Export certificate as PEM
$certFile = "upload_certificate.pem"
Write-Host "Exporting certificate as PEM file..." -ForegroundColor Green

$exportArgs = @(
    "-export",
    "-rfc",
    "-keystore", $keystoreName,
    "-alias", $alias,
    "-file", $certFile,
    "-storepass", $keystorePasswordPlain
)

$exportSuccess = $false
try {
    & keytool $exportArgs 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $exportSuccess = $true
    }
} catch {
    Write-Host "✗ Error exporting certificate: $_" -ForegroundColor Red
    exit 1
}

if (-not $exportSuccess) {
    Write-Host "✗ Failed to export certificate" -ForegroundColor Red
    Write-Host "Check your keystore password and alias name" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✓ Certificate exported successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Upload the file '$certFile' to Google Play Console" -ForegroundColor Yellow
Write-Host "   - Go to: Play Console > Setup > App signing" -ForegroundColor Yellow
Write-Host "   - Click 'Request upload key reset'" -ForegroundColor Yellow
Write-Host "   - Upload the PEM certificate file" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. After Google approves the reset:" -ForegroundColor Yellow
Write-Host "   - Update keystore.properties with new keystore details" -ForegroundColor Yellow
Write-Host "   - Use this new keystore for all future uploads" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. IMPORTANT: Keep these files safe:" -ForegroundColor Red
Write-Host "   - $keystoreName" -ForegroundColor Red
Write-Host "   - Keystore password: [SAVED SECURELY]" -ForegroundColor Red
Write-Host "   - Key password: [SAVED SECURELY]" -ForegroundColor Red
Write-Host ""
Write-Host "4. Keystore details to save:" -ForegroundColor Yellow
Write-Host "   - Keystore file: $keystoreName" -ForegroundColor White
Write-Host "   - Alias: $alias" -ForegroundColor White
Write-Host "   - Keystore password: [YOUR PASSWORD]" -ForegroundColor White
Write-Host "   - Key password: [YOUR KEY PASSWORD]" -ForegroundColor White
Write-Host ""
