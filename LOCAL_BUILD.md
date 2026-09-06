# Local Android build — MediVision AI

Build a signed release APK/AAB with Android Studio + Gradle, no EAS. Same flow as
the PlantDoc app.

## Requirements

| Tool | Version |
|---|---|
| Java JDK | 21 (`C:\Program Files\Java\jdk-21.0.11`) |
| Android SDK | API 34+ (`%ANDROID_HOME%` = `C:\Users\Subham\AppData\Local\Android\Sdk`) |
| Node | 20+ |

## One-time: release keystore

```powershell
& "C:\Program Files\Java\jdk-21.0.11\bin\keytool.exe" -genkey -v `
  -keystore "D:\D\my docs\my docs\projects\health domain model zoo\MediVisionAI app\medivision.keystore" `
  -alias medivision -keyalg RSA -keysize 2048 -validity 10000
```

> Never commit or delete this file. Losing it = can't update the app on Play.
> Register its SHA-1 in Firebase (see `FIREBASE_SETUP.md`).

## Build steps

```bash
cd "D:\D\my docs\my docs\projects\health domain model zoo\MediVisionAI app\app"
npm install

# 1. Native project (re-run after adding Expo plugins / native modules)
npx expo prebuild --platform android --clean

# 2. Signing config — edit android/app/build.gradle → signingConfigs.release
#    to point at ..\..\..\medivision.keystore (see PlantDoc's build.gradle for
#    the exact block). Reads KEYSTORE_PASSWORD from the environment.

# 3. Build
cd android
$env:KEYSTORE_PASSWORD = "<your password>"
.\gradlew assembleRelease      # APK  -> app\build\outputs\apk\release\app-release.apk
.\gradlew bundleRelease        # AAB  -> app\build\outputs\bundle\release\app-release.aab
```

Install on a device:

```bash
adb install android\app\build\outputs\apk\release\app-release.apk
```

## Per-release checklist

1. Bump `version` and `android.versionCode` in `app.json`.
2. `npx expo prebuild --platform android --clean`
3. `.\gradlew bundleRelease`
4. Test the APK on a real device.
5. Upload the `.aab` to the Play Console.
6. `git tag v1.x.x`

## Common fixes

| Error | Fix |
|---|---|
| `SDK location not found` | Create `android/local.properties` with `sdk.dir=C\:\\Users\\Subham\\AppData\\Local\\Android\\Sdk` |
| `google-services.json is missing` | Copy it to `android/app/` (see `FIREBASE_SETUP.md`) |
| `keytool not recognized` | Use the full JDK path shown above |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Uninstall the previous build from the device first |
