@echo off
REM ========================================
REM Pre-compile expo-linking before main build
REM ========================================
REM This script compiles expo-linking first to ensure classes exist

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo ========================================
echo Step 1: Compiling expo-linking module...
echo ========================================
echo.

REM Change to android directory (gradlew.bat must be run from there)
cd android

REM Try to compile expo-linking using assembleDebug (includes all compilation)
echo Attempting to compile expo-linking...
call gradlew.bat :expo-linking:assembleDebug --no-daemon
set COMPILE_RESULT=%ERRORLEVEL%

REM Go back to project root
cd ..

if %COMPILE_RESULT% EQU 0 (
    echo.
    echo ✓ expo-linking build completed!
    echo.
) else (
    echo.
    echo WARNING: expo-linking compilation returned code %COMPILE_RESULT%
    echo Continuing anyway - classes might already exist...
    echo.
)

REM Verify classes exist
echo Checking if expo-linking classes exist...
if exist "node_modules\expo-linking\android\build\classes\kotlin\debug" (
    echo ✓ Kotlin classes directory found
) else (
    echo ✗ Kotlin classes directory NOT found
)

if exist "node_modules\expo-linking\android\build\classes\java\debug" (
    echo ✓ Java classes directory found
) else (
    echo ✗ Java classes directory NOT found
)

echo.
echo ========================================
echo Step 2: Running full Android build...
echo ========================================
echo.

REM Now run the main build script
call build-android-admin.bat

exit /b %ERRORLEVEL%

