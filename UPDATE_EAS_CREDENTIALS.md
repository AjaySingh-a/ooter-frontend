# Update EAS Credentials - Step by Step Guide

## Problem
Your bundle is being signed with the wrong keystore fingerprint:
- **Expected**: `6C:89:B4:5A:A5:BC:5D:D0:8A:86:09:29:49:FA:8A:B6:46:EB:D4:3D` (new keystore)
- **Uploaded**: `92:C3:27:4B:54:8A:37:6A:F5:D2:ED:9E:17:F3:8D:BB:8F:24:05:39` (old EAS credentials)

## Solution: Update EAS Credentials

### Option 1: Update EAS Credentials (Recommended)

1. **Open PowerShell/Terminal** in the project directory:
   ```powershell
   cd C:\Users\ASUS\Downloads\Ooter\ooter-frontend
   ```

2. **Run EAS credentials command**:
   ```bash
   eas credentials
   ```

3. **Follow the prompts**:
   - Select platform: **android**
   - Select action: **Update credentials**
   - For Keystore: **Upload new keystore**
   - Upload file: `upload-keystore.jks` (from project root)
   - Enter password: `9910558081Aa@`
   - Enter alias: `upload`
   - Complete the process

4. **Verify** the credentials were updated successfully

5. **Rebuild** your app:
   ```bash
   eas build --platform android --profile production
   ```

### Option 2: Delete EAS Credentials (Use Local Keystore)

If you want EAS to use your local `keystore.properties` file instead:

1. **Run EAS credentials**:
   ```bash
   eas credentials
   ```

2. **Follow the prompts**:
   - Select platform: **android**
   - Select action: **Remove credentials**
   - Confirm deletion

3. **EAS will now use** your local `keystore.properties` file

4. **Rebuild** your app:
   ```bash
   eas build --platform android --profile production
   ```

## Keystore Details

- **File**: `upload-keystore.jks`
- **Location**: Project root (`ooter-frontend/`)
- **Alias**: `upload`
- **Password**: `9910558081Aa@`
- **Fingerprint**: `6C:89:B4:5A:A5:BC:5D:D0:8A:86:09:29:49:FA:8A:B6:46:EB:D4:3D`

## After Update

Once credentials are updated:
1. ✅ New builds will use the correct keystore
2. ✅ Bundle will have fingerprint: `6C:89:B4:5A:A5:BC:5D:D0:8A:86:09:29:49:FA:8A:B6:46:EB:D4:3D`
3. ✅ Google Play will accept the upload
4. ✅ No more "wrong key" errors

## Quick Script

You can also use the helper script:
```powershell
.\update-eas-credentials.ps1
```

This will guide you through the process.

