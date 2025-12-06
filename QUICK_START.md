# Quick Start - Generate Upload Key

## Option 1: Interactive PowerShell (Recommended)

```powershell
.\generate-new-upload-key.ps1
```

## Option 2: Direct Command (Replace passwords)

Open PowerShell or Command Prompt and run:

```bash
# Step 1: Generate keystore (replace YOUR_PASSWORD)
keytool -genkeypair -v -storetype JKS -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 9125 -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD -dname "CN=Ooter App, OU=Development, O=Ooter, C=US"

# Step 2: Export certificate
keytool -export -rfc -keystore upload-keystore.jks -alias upload -file upload_certificate.pem -storepass YOUR_PASSWORD
```

## Option 3: Edit and Run Batch File

1. Open `generate-upload-key-simple.bat`
2. Replace `YOUR_KEYSTORE_PASSWORD` and `YOUR_KEY_PASSWORD` with your actual passwords
3. Double-click to run

## After Generation

1. You'll get two files:
   - `upload-keystore.jks` - Your new keystore (KEEP THIS SAFE!)
   - `upload_certificate.pem` - Upload this to Google Play

2. Upload to Google Play:
   - Go to: https://play.google.com/console
   - Your App → Setup → App signing
   - Click "Request upload key reset"
   - Upload `upload_certificate.pem`

3. Wait for approval (1-2 business days)

4. After approval, update `keystore.properties`:
   ```properties
   storeFile=upload-keystore.jks
   storePassword=YOUR_PASSWORD
   keyAlias=upload
   keyPassword=YOUR_PASSWORD
   ```

## Important Notes

- ⚠️ Save your passwords in a secure password manager
- ⚠️ Never commit keystore files to git
- ⚠️ Keep a backup of the keystore in secure storage

