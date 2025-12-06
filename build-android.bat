@echo off
REM Set JAVA_TOOL_OPTIONS for SQLite JDBC fix before building
set JAVA_TOOL_OPTIONS=-Dorg.sqlite.lib.path=%USERPROFILE%\.sqlite -Djava.io.tmpdir=%USERPROFILE%\.gradle\tmp
echo JAVA_TOOL_OPTIONS set to: %JAVA_TOOL_OPTIONS%
echo.
npx expo run:android
