@echo off
REM Script to temporarily disable CMake build in expo-modules-core
REM This fixes the CXX1210 "No compatible library found" error

setlocal enabledelayedexpansion

set "BUILD_GRADLE=%CD%\node_modules\expo-modules-core\android\build.gradle"
set "BACKUP_GRADLE=%BUILD_GRADLE%.backup"

echo ========================================
echo Disabling CMake build in expo-modules-core
echo ========================================
echo.

if not exist "%BUILD_GRADLE%" (
    echo ERROR: build.gradle not found at: %BUILD_GRADLE%
    echo Please run this script from the project root directory.
    exit /b 1
)

REM Create backup if it doesn't exist
if not exist "%BACKUP_GRADLE%" (
    echo Creating backup of build.gradle...
    copy "%BUILD_GRADLE%" "%BACKUP_GRADLE%" >nul
    echo Backup created: %BACKUP_GRADLE%
) else (
    echo Backup already exists, skipping backup creation.
)

echo.
echo Commenting out externalNativeBuild blocks in build.gradle...
echo.

REM Use PowerShell to comment out the externalNativeBuild blocks
powershell -Command "$content = Get-Content '%BUILD_GRADLE%' -Raw; $content = $content -replace '(  externalNativeBuild \{)', '  // TEMPORARILY DISABLED - CMake CXX1210 fix`r`n  // $1'; $content = $content -replace '(    cmake \{)', '    // $1'; $content = $content -replace '(      abiFilters)', '      // $1'; $content = $content -replace '(      arguments)', '      // $1'; $content = $content -replace '(      path)', '      // $1'; $content = $content -replace '(\})', '  // $1'; Set-Content '%BUILD_GRADLE%' -Value $content -NoNewline"

if errorlevel 1 (
    echo ERROR: Failed to modify build.gradle
    echo Restoring from backup...
    copy "%BACKUP_GRADLE%" "%BUILD_GRADLE%" >nul
    exit /b 1
)

echo [OK] CMake build disabled in expo-modules-core
echo.
echo To restore CMake build later, run:
echo   copy "%BACKUP_GRADLE%" "%BUILD_GRADLE%"
echo.

endlocal

