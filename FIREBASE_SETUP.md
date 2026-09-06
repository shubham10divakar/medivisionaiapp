# Firebase setup — MediVision AI

The app runs without Firebase (local-only "demo" mode), but Google / email
sign-in and cloud run history need a Firebase project. This mirrors the PlantDoc
setup.

## 1. Create the project

1. <https://console.firebase.google.com> → **Add project** (e.g. `medivision-ai`).
2. **Authentication → Get started → Sign-in method**, enable:
   - **Email/Password**
   - **Google**
   - **Anonymous**
3. **Firestore Database → Create database** (production mode, a region near your users).

## 2. Register the Android app

1. Project settings → **Your apps → Add app → Android**.
2. Package name: **`com.medivisionai.app`** (must match `app.json` → `android.package`).
3. Add both signing SHA-1 fingerprints:

   ```powershell
   # debug
   & "C:\Program Files\Java\jdk-21.0.11\bin\keytool.exe" -list -v `
     -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey `
     -storepass android -keypass android

   # release — the keystore you'll create in LOCAL_BUILD.md
   & "C:\Program Files\Java\jdk-21.0.11\bin\keytool.exe" -list -v `
     -keystore "D:\...\medivision.keystore" -alias medivision
   ```

4. Download **`google-services.json`**.

## 3. Drop the files in

```
app/google-services.json            <- for `expo prebuild`
app/android/app/google-services.json <- after prebuild, if not copied automatically
```

Both paths are gitignored. `expo prebuild` wires the `com.google.gms.google-services`
Gradle plugin automatically for a bare RN Firebase project on SDK 52; if a build
complains it's missing, confirm `google-services.json` is at `app/android/app/`.

## 4. Web client ID for Google Sign-In

Firebase console → Authentication → Sign-in method → **Google → Web SDK
configuration → Web client ID**. Put it in `.env`:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
```

`services/firebase.ts` reads this; until it's a real value, `googleConfigured` is
`false` and the Google button is hidden (email + guest still work).

## 5. Firestore rules

Each user reads/writes only their own runs; feedback is create-only.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid}/runs/{run} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /feedback/{doc} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}
```

## 6. Rebuild

```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

Sign-in should now work. If `onAuthStateChanged` never fires, the app logs it
(Settings has no debug view yet — check Metro logs) and drops to local-demo mode
after 5 s.
