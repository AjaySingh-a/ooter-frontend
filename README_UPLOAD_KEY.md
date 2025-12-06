# Upload Key Reset - Complete Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Generate New Key
```powershell
cd ooter-frontend
.\generate-new-upload-key.ps1
```
या फिर direct command:
```bash
keytool -genkeypair -v -storetype JKS -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 9125 -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD -dname "CN=Ooter App, OU=Development, O=Ooter, C=US"

keytool -export -rfc -keystore upload-keystore.jks -alias upload -file upload_certificate.pem -storepass YOUR_PASSWORD
```

### Step 2: Upload to Google Play
1. https://play.google.com/console पर जाएं
2. Your App → **Setup** → **App signing**
3. **"Request upload key reset"** click करें
4. `upload_certificate.pem` file upload करें
5. Reason select करें और submit करें

### Step 3: Wait & Update (After Approval)
- Google approval (1-2 business days)
- Approval के बाद `keystore.properties` update करें:
  ```properties
  storeFile=upload-keystore.jks
  storePassword=YOUR_PASSWORD
  keyAlias=upload
  keyPassword=YOUR_PASSWORD
  ```

## 📁 Files Created

After running the script, you'll have:
- ✅ `upload-keystore.jks` - Your new keystore (KEEP SAFE!)
- ✅ `upload_certificate.pem` - Upload this to Google Play

## ⚠️ Important Security

- 🔒 Keystore password को secure password manager में save करें
- 🔒 Keystore file को secure backup location में रखें
- ❌ **NEVER** commit keystore files to git (already in .gitignore)
- ❌ **NEVER** share keystore passwords

## 📝 Available Scripts

1. **`generate-new-upload-key.ps1`** - Interactive PowerShell script (recommended)
2. **`export-upload-certificate.ps1`** - Export certificate from existing keystore
3. **`generate-upload-key-simple.bat`** - Simple batch file (edit passwords first)

## 🔧 Troubleshooting

**"keytool: command not found"**
- Java JDK install करें
- PATH में Java bin directory add करें
- Windows: Usually at `C:\Program Files\Java\jdk-XX\bin`

**"Keystore was tampered with"**
- Password check करें
- Correct keystore file use करें

## 📚 More Info

- Detailed instructions: `UPLOAD_KEY_RESET_INSTRUCTIONS.md`
- Quick reference: `QUICK_START.md`

