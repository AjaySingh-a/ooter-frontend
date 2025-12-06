# Google Play Upload Key Reset Instructions

This guide will help you generate a new upload key and submit it to Google Play Console for approval.

## Overview

When you need to reset your Google Play upload key (due to loss, compromise, or other reasons), you need to:
1. Generate a new upload key (keystore)
2. Export the certificate as a PEM file
3. Submit the PEM file to Google Play Console
4. Wait for approval
5. Use the new key for future uploads

## Step 1: Generate New Upload Key

### Option A: Using PowerShell Script (Recommended for Windows)

1. Open PowerShell in the `ooter-frontend` directory
2. Run the generation script:
   ```powershell
   .\generate-new-upload-key.ps1
   ```
3. Follow the prompts to:
   - Set a secure keystore password (save this!)
   - Set a key password (or use the same as keystore)
   - Enter certificate information (or use defaults)

This will create:
- `upload-keystore.jks` - Your new upload keystore
- `upload_certificate.pem` - Certificate file to upload to Google Play

### Option B: Manual Generation

If you prefer to generate manually, use this command:

```bash
keytool -genkeypair -v -storetype JKS -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 9125 -storepass YOUR_KEYSTORE_PASSWORD -keypass YOUR_KEY_PASSWORD -dname "CN=Ooter App, OU=Development, O=Ooter, C=US"
```

Then export the certificate:

```bash
keytool -export -rfc -keystore upload-keystore.jks -alias upload -file upload_certificate.pem -storepass YOUR_KEYSTORE_PASSWORD
```

## Step 2: Export Certificate (if using existing keystore)

If you already have a keystore and just need to export the certificate:

```powershell
.\export-upload-certificate.ps1
```

Or manually:

```bash
keytool -export -rfc -keystore upload-keystore.jks -alias upload -file upload_certificate.pem -storepass YOUR_KEYSTORE_PASSWORD
```

## Step 3: Submit to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Navigate to: **Setup** > **App signing**
4. Click **Request upload key reset**
5. Select the reason for resetting:
   - I lost my upload key
   - Developer with access to the keystore has left my company
   - My upload key has been compromised
   - I forgot the password to my keystore
   - Other
6. Upload the `upload_certificate.pem` file
7. Submit the request

## Step 4: Wait for Approval

- Google typically reviews upload key reset requests within 1-2 business days
- You'll receive an email notification when approved
- **Do not delete your old keystore** until the reset is approved and you've successfully uploaded a new release

## Step 5: Update Configuration (After Approval)

Once Google approves the reset:

1. **Update `keystore.properties`** with your new keystore details:
   ```properties
   storeFile=upload-keystore.jks
   storePassword=YOUR_NEW_KEYSTORE_PASSWORD
   keyAlias=upload
   keyPassword=YOUR_NEW_KEY_PASSWORD
   ```

2. **Update `android/app/build.gradle`** to use the release signing config (if not already configured)

3. **Test the build** to ensure everything works:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

## Important Security Notes

⚠️ **CRITICAL**: Keep your keystore and passwords secure!

- Store the keystore file (`upload-keystore.jks`) in a secure location
- Save passwords in a password manager
- Never commit keystore files or passwords to version control
- Consider backing up the keystore to a secure cloud storage (encrypted)
- If using EAS Build, you may want to use EAS credentials management instead

## Troubleshooting

### "keytool: command not found"
- Make sure Java JDK is installed
- Add Java bin directory to your PATH
- On Windows, Java is usually at: `C:\Program Files\Java\jdk-XX\bin`

### "Keystore was tampered with, or password was incorrect"
- Double-check your keystore password
- Make sure you're using the correct keystore file

### "Alias does not exist"
- Verify the alias name matches what's in the keystore
- List aliases: `keytool -list -keystore upload-keystore.jks -storepass YOUR_PASSWORD`

## Additional Resources

- [Google Play App Signing Documentation](https://support.google.com/googleplay/android-developer/answer/9842756)
- [Android App Signing Guide](https://developer.android.com/studio/publish/app-signing)

