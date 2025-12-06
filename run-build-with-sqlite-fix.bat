@echo off
REM This script sets up environment and runs npx expo run:android
REM It ensures SQLite JDBC can work on Windows

REM Create directories
if not exist "%USERPROFILE%\.sqlite" mkdir "%USERPROFILE%\.sqlite"
if not exist "%USERPROFILE%\.gradle\tmp" mkdir "%USERPROFILE%\.gradle\tmp"

REM Try to delete lock files (may fail without admin - that's OK)
del /F /Q C:\WINDOWS\sqlite-*.dll.lck 2>nul

REM Set environment variables that SQLite JDBC will check
set org.sqlite.lib.path=%USERPROFILE%\.sqlite
set java.io.tmpdir=%USERPROFILE%\.gradle\tmp
set JAVA_TOOL_OPTIONS=-Dorg.sqlite.lib.path=%USERPROFILE%\.sqlite -Djava.io.tmpdir=%USERPROFILE%\.gradle\tmp

REM Run the build
npx expo run:android

