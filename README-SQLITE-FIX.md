# SQLite JDBC Fix for Windows Build

## Problem
The build fails with `AccessDeniedException` when Room tries to extract SQLite JDBC library to `C:\WINDOWS\`.

## ✅ SOLUTION: Use the Admin Build Script

**The easiest way is to use the provided build script that runs as Administrator:**

1. **Right-click** `build-android-admin.bat`
2. Select **"Run as administrator"**
3. Click **"Yes"** on the UAC prompt
4. The script will automatically:
   - Delete SQLite lock files
   - Set environment variables
   - Run `npx expo run:android`

**That's it!** The build should work now.

## Manual Method (If Script Doesn't Work)

### Step 1: Open PowerShell as Administrator

1. Press `Windows` key
2. Type: `PowerShell`
3. **Right-click** "Windows PowerShell"
4. Select **"Run as administrator"**
5. Click **"Yes"** on UAC prompt

### Step 2: Navigate to Project

```powershell
cd "C:\Users\ASUS\Downloads\Ooter\ooter-frontend"
```

### Step 3: Delete Lock Files

```powershell
Remove-Item "C:\WINDOWS\sqlite-*.dll.lck" -Force
```

### Step 4: Run Build (in your regular terminal)

```bash
npx expo run:android
```

## Why This Happens

Room's DatabaseVerifier initializes SQLite JDBC in a static block, and kapt workers are isolated JVM processes. SQLite JDBC tries to write to `C:\WINDOWS\` first, which requires admin rights. Lock files are created during failed attempts and block subsequent builds.

## Alternative Scripts

- `build-android-admin.bat` - **Recommended** - Runs as admin automatically
- `run-build-with-sqlite-fix.bat` - Tries without admin (may fail)
- `delete-sqlite-locks.ps1` - Manual cleanup script

