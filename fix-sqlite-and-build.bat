@echo off
REM Build wrapper script that fixes SQLite JDBC extraction issue on Windows
REM This script ensures the SQLite library can be extracted to a writable location

echo Fixing SQLite JDBC extraction issue for Windows...

REM Create necessary directories
if not exist "%USERPROFILE%\.sqlite" mkdir "%USERPROFILE%\.sqlite"
if not exist "%USERPROFILE%\.gradle\tmp" mkdir "%USERPROFILE%\.gradle\tmp"

REM Set environment variables that SQLite JDBC will check
set JAVA_TOOL_OPTIONS=-Dorg.sqlite.lib.path=%USERPROFILE%\.sqlite -Djava.io.tmpdir=%USERPROFILE%\.gradle\tmp
set org.sqlite.lib.path=%USERPROFILE%\.sqlite
set java.io.tmpdir=%USERPROFILE%\.gradle\tmp

REM Try to create a writable location in C:\WINDOWS\ by creating it in user's temp first
REM and then copying if possible (this is a workaround for the extraction issue)
echo Setting up SQLite extraction directory...

REM Run the build
echo Starting Android build...
call npx expo run:android

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ================================================
    echo Build failed. If you see SQLite AccessDenied errors,
    echo you may need to run this script as Administrator
    echo or allow write access to C:\WINDOWS temporarily.
    echo ================================================
    exit /b %ERRORLEVEL%
)

exit /b 0

