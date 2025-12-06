@echo off
REM ========================================
REM Build Android App (Run as Administrator)
REM ========================================
REM This script must be run as Administrator to fix SQLite JDBC issues
REM Right-click → Run as administrator

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
REM Change to the script directory (project root)
cd /d "%SCRIPT_DIR%"

echo ========================================
echo Android Build with SQLite Fix
echo ========================================
echo.
echo Working directory: %CD%
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

echo [1/4] Running as Administrator - OK
echo.

REM Create directories
echo [2/4] Creating SQLite directories...
if not exist "%USERPROFILE%\.sqlite" mkdir "%USERPROFILE%\.sqlite"
if not exist "%USERPROFILE%\.gradle\tmp" mkdir "%USERPROFILE%\.gradle\tmp"
echo [OK] Directories created
echo.

REM Delete lock files (we have admin rights now)
echo [3/4] Cleaning SQLite lock files...
del /F /Q "C:\WINDOWS\sqlite-*.dll.lck" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Lock files cleaned
) else (
    echo [OK] No lock files found (or already cleaned)
)
echo.

REM Start background process to continuously delete lock files during build
echo Starting continuous lock file cleanup (runs in background)...
start /B cmd /c "for /L %%i in (1,1,500) do (timeout /t 1 /nobreak >nul 2>&1 & del /F /Q C:\WINDOWS\sqlite-*.dll.lck >nul 2>&1)"
echo [OK] Lock file monitor started (cleanup runs every 1 second)
echo.

REM Set environment variables
echo [4/4] Setting environment variables...
set JAVA_TOOL_OPTIONS=-Dorg.sqlite.lib.path=%USERPROFILE%\.sqlite -Djava.io.tmpdir=%USERPROFILE%\.gradle\tmp
set org.sqlite.lib.path=%USERPROFILE%\.sqlite
set java.io.tmpdir=%USERPROFILE%\.gradle\tmp

REM Set NDK path for CMake
set NDK_PATH=%LOCALAPPDATA%\Android\Sdk\ndk\26.1.10909125
if exist "%NDK_PATH%" (
    set ANDROID_NDK_HOME=%NDK_PATH%
    set ANDROID_NDK_ROOT=%NDK_PATH%
)

echo [OK] Environment variables set
echo.

echo ========================================
echo Pre-compiling expo-linking module...
echo ========================================
echo.

REM Try to compile expo-linking first to ensure Kotlin plugin is applied
echo Running expo-linking pre-compilation...
cd android
call gradlew.bat :expo-linking:assembleDebug --no-daemon >nul 2>&1
set PREBUILD_RESULT=%ERRORLEVEL%
cd ..

if %PREBUILD_RESULT% NEQ 0 (
    echo WARNING: expo-linking pre-compilation returned code %PREBUILD_RESULT%
    echo Continuing with main build anyway...
) else (
    echo [OK] expo-linking pre-compilation completed
)
echo.

echo ========================================
echo Starting Android build...
echo ========================================
echo.

REM Ensure we're in the correct directory
cd /d "%SCRIPT_DIR%"

REM Set architecture environment variable to ensure consistency
set REACT_NATIVE_ARCHITECTURES=arm64-v8a

REM Restore NDK 26 if it was disabled in a previous build attempt
set NDK26_DIR=%LOCALAPPDATA%\Android\Sdk\ndk\26.1.10909125
set NDK26_DISABLED=%LOCALAPPDATA%\Android\Sdk\ndk\26.1.10909125.disabled
if exist "%NDK26_DISABLED%" (
    echo Restoring NDK 26
    ren "%NDK26_DISABLED%" "26.1.10909125" 2>nul
    if errorlevel 1 (
        echo WARNING: Could not restore NDK 26
    ) else (
        echo NDK 26 restored successfully
    )
)

REM Verify NDK is available
if not exist "%NDK26_DIR%" (
    echo WARNING: NDK 26.1.10909125 not found
    echo Gradle will try to auto-detect NDK version
)

REM Run the build - only build for arm64-v8a to match app configuration
REM Using gradlew directly to ensure architecture is set correctly
echo Building Android app (arm64-v8a only)...
cd android

REM First, ensure React Native native libraries are built (this generates CMake config)
echo Building React Native native libraries (required for expo-modules-core CMake)...
call gradlew.bat :app:prepareReactNativeDebug --no-daemon -PreactNativeArchitectures=arm64-v8a 2>&1 | findstr /C:"BUILD" /C:"FAILED" /C:"SUCCESS" /C:"ERROR" /C:"configureCMake" /C:"ReactAndroid"

REM Now run the main build (CMake is disabled in expo-modules-core build.gradle)
echo Running main build...
call gradlew.bat app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeArchitectures=arm64-v8a
set BUILD_RESULT=%ERRORLEVEL%
cd ..

REM Stop the background cleanup process
taskkill /F /FI "WINDOWTITLE eq cmd*" /FI "STATUS eq RUNNING" >nul 2>&1

REM Final cleanup
del /F /Q "C:\WINDOWS\sqlite-*.dll.lck" 2>nul

if %BUILD_RESULT% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCEEDED!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo BUILD FAILED (Exit code: %BUILD_RESULT%)
    echo ========================================
)

exit /b %BUILD_RESULT%

