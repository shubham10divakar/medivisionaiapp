# Local Android build — MediVision AI

Build a signed release APK/AAB with Android Studio + Gradle, no EAS. Same flow as
the PlantDoc app.

## Requirements

| Tool | Version |
|---|---|
| Java JDK | 21 (`C:\Program Files\Java\jdk-21.0.11`) |
| Android SDK | API 34+ (`%ANDROID_HOME%` = `C:\Users\Subham\AppData\Local\Android\Sdk`) |
| Node | 20+ |

## Signing keystores (already set up — outside the app folder)

Both keystores live **next to** the app folder, outside git and safe from
`expo prebuild --clean`:

```
D:\D\my docs\my docs\projects\health domain model zoo\MediVisionAI app\keystores\
  debug.keystore        alias androiddebugkey, password android
  medivision.keystore   alias medivision (release / upload key)
  keystore.properties   release alias + passwords (read by Gradle)
```

How it is wired:

- `plugins/withSigning.js` (listed in `app.json` → `plugins`) rewrites
  `signingConfigs` in `android/app/build.gradle` on every prebuild: debug builds
  sign with `debug.keystore`, release builds with `medivision.keystore`.
- Gradle finds the folder via `MEDIVISION_KEYSTORE_DIR` in
  `C:\Users\Subham\.gradle\gradle.properties` (so the `C:\mv\app` build copy works
  too), else the env var of the same name, else `<app>\..\keystores`.
- If the folder is missing (another PC), builds fall back to the Expo template
  debug key — Google Sign-In will then fail until the folder is restored.

Fingerprints (registered in Firebase — see `FIREBASE_SETUP.md`):

| Key | SHA-1 | SHA-256 |
|---|---|---|
| debug | `99:26:50:DC:DD:9B:E4:C8:A1:5E:54:1A:65:CA:14:BE:8A:10:2C:29` | `D8:20:55:60:98:19:D9:30:20:9C:35:C8:CF:7F:1D:D6:3D:D6:2B:C3:2E:B7:5D:50:3C:71:02:16:0D:80:06:18` |
| release | `B2:B1:BD:05:C4:BA:FC:0C:42:18:8A:34:97:4C:BC:D7:34:DA:61:BA` | `AF:94:00:2B:D5:AC:26:FB:54:89:E5:E1:5A:70:BA:65:D3:A3:50:DC:6E:DD:F5:8D:B3:C8:C5:CF:8C:E4:0F:34` |

Re-check any time with `cd android; .\gradlew :app:signingReport`.

> **Back up the whole `keystores` folder** (password manager / offline drive).
> Never commit it. Losing `medivision.keystore` or the password in
> `keystore.properties` = can't update the app on Play.

## ⚠️ Build from a short path (Windows 260-char limit)

This project's real folder (`D:\D\my docs\my docs\projects\health domain model zoo\MediVisionAI app\app`)
is **too long to build on Windows**. Several dependencies ship native **C++**
(`react-native-reanimated`, `react-native-screens`, `expo-modules-core`, RN 0.76
New Architecture). Gradle compiles them with CMake + ninja, and ninja stacks the
full project path onto deep object-file folders → past Windows' 260-character
`MAX_PATH` → fails with:

```
ninja: error: mkdir(src/main/cpp/worklets/CMakeFiles/worklets.dir/D_/D/my_docs/...): No such file or directory
Execution failed for task ':react-native-reanimated:buildCMakeDebug[arm64-v8a]'
```

Your TypeScript code is not the problem — only the C++ compile step is.

**What does NOT work:** `subst M: "<long path>"` (or a junction). The C++ build
resolves back to the real `D:\…` path and still fails.

**What works:** a real copy in a short folder, e.g. `C:\mv\app` (current build copy):

```powershell
robocopy "<long path>\app" "C:\mv\app" /E /XD node_modules build .gradle .cxx .expo
cd C:\mv\app
npm ci
npx expo run:android          # debug build → installs on the USB-connected phone
```

Notes:
- If a build already failed on the long path, delete the stale C++ caches first:
  `node_modules\react-native-reanimated\android\.cxx` and
  `node_modules\expo-modules-core\android\.cxx` (they need a long-path-safe delete,
  e.g. `rm -rf` from Git Bash).
- `npx expo run:android --device <x>` wants the device **name**, not the adb serial.
  With one phone connected, omit `--device`.
- A debug build loads JS from Metro on the PC — keep USB connected
  (`adb reverse tcp:8081 tcp:8081`) or build a release APK for standalone use.
- Two copies drift. Long term: move the working repo to a short, space-free path
  such as `C:\dev\medivision`.

## Build steps

```bash
cd "D:\D\my docs\my docs\projects\health domain model zoo\MediVisionAI app\app"
npm install

# 1. Native project (re-run after adding Expo plugins / native modules)
npx expo prebuild --platform android --clean

# 2. Signing config — nothing to do. plugins/withSigning.js wires the external
#    keystores during prebuild (see "Signing keystores" above).

# 3. Build
cd android
.\gradlew assembleRelease      # APK  -> app\build\outputs\apk\release\app-release.apk
.\gradlew bundleRelease        # AAB  -> app\build\outputs\bundle\release\app-release.aab
```

Install on a device:

```bash
adb install android\app\build\outputs\apk\release\app-release.apk
```

## Play Store release kit

Store graphics, screenshots, listing copy, the release AAB and the publish
checklist (including current blockers) live outside the repo in
`..\playstore\` — start with `..\playstore\README.md`.

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
| All icons blank (tab bar, buttons) | `expo-file-system` must be a **direct** dependency in `package.json` — if it is only nested under `node_modules/expo/`, it isn't autolinked and the icon font can't load. `npx expo install expo-file-system`, then rebuild |
