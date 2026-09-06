# MediVision AI — Android app

An Expo / React Native companion to **medivisionai.in**: run the open
ChestX-ray14 models on your own images, see all 14 thoracic findings scored with
confidence, and read a plain-language reference for each one.

> Research and educational demo. **Not a medical device** — not for diagnosis or
> clinical decisions.

Built from the same structure as the PlantDoc app (`D:\androidppPlantDoc\PlantDoc\app`),
retargeted from single-label plant disease to **multilabel chest X-ray**.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.76 + Expo SDK 52 |
| Routing | expo-router (file-based) — 5 tabs + stack screens |
| State | zustand + AsyncStorage (`store/useStore.ts`) |
| Auth | Firebase Auth — Google, email/password, anonymous (`services/firebase.ts`) |
| Cloud history | Cloud Firestore (`users/{uid}/runs`) |
| Camera / images | expo-camera, expo-image-picker, expo-image-manipulator |
| Backend | `https://medivisionai.in/api` — `GET /models`, `POST /predict` |

The backend gateway injects the API key server-side, so **no secret ships in the
app**. The API base URL is `EXPO_PUBLIC_API_URL` (`.env`) and is overridable in
Settings.

---

## Screens

```
app/
├── _layout.tsx          Auth + onboarding gate, theme, native bg colour
├── login.tsx            Google / email / guest / "continue without an account"
├── onboarding.tsx       4-slide intro (shown once, post-login)
├── result.tsx           One prediction — image, positive findings, all 14 bars
├── condition.tsx        One finding — what it is, causes, radiographic signs
└── (tabs)/
    ├── index.tsx        Home — stats, active model, recent runs, about
    ├── scan.tsx         "Demo" — pick image, model, threshold → Run Prediction
    ├── history.tsx      On-device + cloud run history
    ├── learn.tsx        The 2 models + all 14 ChestX-ray14 findings (searchable)
    └── settings.tsx     Account, dark mode, API URL, default model, feedback
```

`constants/conditions.ts` holds the educational text for the 14 findings.
`constants/models.ts` is the offline model list; the Demo screen merges it with a
live `GET /models`.

---

## Run it

Prerequisites: Node 20+, the Expo tooling, an Android SDK, and **Firebase set up**
(see `FIREBASE_SETUP.md` — the app falls back to a local-only "demo" mode if
Firebase isn't configured, so you can see the UI before doing that).

```bash
cd "D:\D\my docs\my docs\projects\health domain model zoo\MediVisionAI app\app"
npm install
cp .env.example .env          # already points at https://medivisionai.in/api

# Generate the native project (re-run after adding/removing Expo plugins or
# native deps like Firebase):
npx expo prebuild --platform android --clean

# Then either:
npx expo run:android          # debug build on a device/emulator
# or a release APK/AAB — see LOCAL_BUILD.md
```

`npm run typecheck` runs `tsc --noEmit`.

---

## Notes for future growth

- **Models are not hard-coded into the UX.** `GET /models` drives the picker, so
  enabling the COVID models on the backend surfaces them here with no app update.
  `constants/models.ts` only supplies friendly names + the offline fallback.
- **`condition.tsx` scales to any label.** Unknown labels render a generic
  template, so a new dataset's findings still get a detail screen.
- **Cloud history stores a summary only** (model, positive labels, latency,
  threshold) — never the image. Full per-finding scores stay on the device that
  ran the prediction.
- **Local-demo mode** (`store/LOCAL_USER`) keeps the whole app usable with no
  account, which is the intended low-friction path for researchers trying it once.
