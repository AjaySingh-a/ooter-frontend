@echo off
REM Simple batch script to generate new upload key for Google Play
REM Replace YOUR_KEYSTORE_PASSWORD and YOUR_KEY_PASSWORD with your actual passwords

echo ========================================
echo Google Play Upload Key Generator
echo ========================================
echo.

set KEYSTORE_NAME=upload-keystore.jks
set ALIAS=upload
set CERT_FILE=upload_certificate.pem

REM Set your passwords here (or you'll be prompted)
set KEYSTORE_PASS=YOUR_KEYSTORE_PASSWORD
set KEY_PASS=YOUR_KEY_PASSWORD

echo Generating new upload keystore...
echo.

REM Generate the keystore
keytool -genkeypair -v -storetype JKS -keystore %KEYSTORE_NAME% -alias %ALIAS% -keyalg RSA -keysize 2048 -validity 9125 -storepass %KEYSTORE_PASS% -keypass %KEY_PASS% -dname "CN=Ooter App, OU=Development, O=Ooter, C=US"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Keystore generated successfully!
    echo.
    echo Exporting certificate as PEM file...
    echo.
    
    REM Export certificate
    keytool -export -rfc -keystore %KEYSTORE_NAME% -alias %ALIAS% -file %CERT_FILE% -storepass %KEYSTORE_PASS%
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo SUCCESS!
        echo ========================================
        echo.
        echo Files created:
        echo   - %KEYSTORE_NAME%
        echo   - %CERT_FILE%
        echo.
        echo Next Steps:
        echo   1. Upload %CERT_FILE% to Google Play Console
        echo   2. Go to: Play Console ^> Setup ^> App signing
        echo   3. Click "Request upload key reset"
        echo   4. Upload the PEM file
        echo.
        echo IMPORTANT: Save your passwords securely!
        echo   Keystore password: %KEYSTORE_PASS%
        echo   Key password: %KEY_PASS%
        echo.
    ) else (
        echo ERROR: Failed to export certificate
        exit /b 1
    )
) else (
    echo ERROR: Failed to generate keystore
    echo Make sure Java JDK is installed and keytool is in PATH
    exit /b 1
)

pause

