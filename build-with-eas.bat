@echo off
REM ========================================
REM Try EAS Build instead of local build
REM ========================================
REM This script runs EAS build which handles Kotlin compilation correctly

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo ========================================
echo EAS Build for Android
echo ========================================
echo.
echo This will build your app in Expo's cloud environment
echo which handles Kotlin compilation correctly.
echo.
echo Make sure you have:
echo 1. EAS CLI installed: npm install -g eas-cli
echo 2. Logged in: eas login
echo.
pause

echo.
echo Starting EAS build...
echo.

eas build --platform android --profile production

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✓ BUILD SUCCEEDED!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ✗ BUILD FAILED
    echo ========================================
)

pause

