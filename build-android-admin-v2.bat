@echo off
REM ========================================
REM Build Android App (Run as Administrator)
REM Version 2: Continuous lock file cleanup
REM ========================================

echo ========================================
echo Android Build with SQLite Fix (v2)
echo ========================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/5] Running as Administrator - OK
echo.

REM Create directories
echo [2/5] Creating SQLite directories...
if not exist "%USERPROFILE%\.sqlite" mkdir "%USERPROFILE%\.sqlite"
if not exist "%USERPROFILE%\.gradle\tmp" mkdir "%USERPROFILE%\.gradle\tmp"
echo ✓ Directories created
echo.

REM Delete lock files before build
echo [3/5] Cleaning SQLite lock files (pre-build)...
del /F /Q "C:\WINDOWS\sqlite-*.dll.lck" 2>nul
echo ✓ Lock files cleaned
echo.

REM Set environment variables
echo [4/5] Setting environment variables...
set JAVA_TOOL_OPTIONS=-Dorg.sqlite.lib.path=%USERPROFILE%\.sqlite -Djava.io.tmpdir=%USERPROFILE%\.gradle\tmp
set org.sqlite.lib.path=%USERPROFILE%\.sqlite
set java.io.tmpdir=%USERPROFILE%\.gradle\tmp
echo ✓ Environment variables set
echo.

REM Start background process to continuously delete lock files during build
echo [5/5] Starting lock file cleanup monitor...
start /B /MIN cmd /c "for /L %%i in (1,1,1000) do (timeout /t 2 /nobreak >nul 2>&1 & del /F /Q C:\WINDOWS\sqlite-*.dll.lck >nul 2>&1)"
echo ✓ Lock file monitor started (runs in background)
echo.

echo ========================================
echo Starting Android build...
echo ========================================
echo.
echo Note: Lock files will be cleaned automatically during build
echo.

REM Run the build
call npx expo run:android
set BUILD_RESULT=%ERRORLEVEL%

REM Stop the background cleanup process
taskkill /F /FI "WINDOWTITLE eq cmd*" /FI "STATUS eq RUNNING" >nul 2>&1

REM Final cleanup
del /F /Q "C:\WINDOWS\sqlite-*.dll.lck" 2>nul

if %BUILD_RESULT% EQU 0 (
    echo.
    echo ========================================
    echo ✓ BUILD SUCCEEDED!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ✗ BUILD FAILED (Exit code: %BUILD_RESULT%)
    echo ========================================
)

exit /b %BUILD_RESULT%

