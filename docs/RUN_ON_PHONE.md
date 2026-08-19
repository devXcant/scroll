# Run SCROLL on your phone (dev build + Stripe)

**Do not use Expo Go.** You install a **SCROLL** app on your phone once, then Metro reloads JS.

---

## Android phone (recommended — you have Android Studio)

### One-time: phone setup

1. **Settings → About phone** → tap **Build number** 7 times (Developer mode on).
2. **Settings → Developer options** → enable **USB debugging**.
3. Plug phone into Mac with USB cable → tap **Allow** on the phone.

### One-time: install SCROLL on the phone

```bash
cd /Users/devx/Desktop/SCROLL
pnpm install
pnpm api:install
```

```bash
npx expo run:android --device
```

- First run takes **10–20 minutes** (downloads SDK, compiles native code).
- When it finishes, you’ll see **SCROLL** on your phone — not Expo Go.

### Every day: run the app

**Terminal 1 — payments API**

```bash
pnpm run api
```

**Terminal 2 — Metro for the dev client**

```bash
pnpm start
```

**On the phone:** open **SCROLL** (the app that was installed). It connects to your Mac automatically on the same Wi‑Fi.

If it says it can’t connect, shake the phone → **Enter URL manually** → use your Mac’s IP, e.g. `192.168.1.42:8081` (find IP: System Settings → Wi‑Fi → Details).

### Stripe on a real device

In `.env` on your Mac, set API URL to your **LAN IP**, not `localhost`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.42:3001
```

Replace `192.168.1.42` with your Mac’s Wi‑Fi address. Restart `pnpm start` after changing `.env`.

---

## iPhone (physical device)

You need **Xcode** on a Mac, or a cloud build:

### Option A — Mac + Xcode + cable

```bash
npx expo run:ios --device
```

Pick your iPhone when prompted. Trust the developer certificate on the phone (Settings → General → VPN & Device Management).

Then `pnpm run api` + `pnpm start`, open **SCROLL** on the iPhone.

### xcodebuild error 70 / simulator runtime mismatch

Your **Xcode iOS SDK** and **Simulator runtime** must match (any version — not tied to a specific iOS number).

1. Open **Xcode → Settings → Platforms** (or **Components**)
2. Download the **iOS Simulator** runtime that matches your installed SDK
3. Or in Terminal: `xcodebuild -downloadPlatform iOS`
4. List devices: `xcrun simctl list devices available`
5. Run: `npx expo run:ios -d "Your Simulator Name"`

Check setup: `bash scripts/check-ios-build.sh`

### Option B — no Xcode (EAS cloud build)

```bash
npx eas-cli login
npx eas-cli build --profile development --platform ios
```

Open the install link on your iPhone. After install, run `pnpm start` on your Mac and open **SCROLL**.

---

## Android without a Play developer account

You do **not** need Google Play Console to test on your own phone.

1. Enable Developer options + USB debugging (steps above).
2. Plug in the phone, then:

```bash
pnpm android
```

or `npx expo run:android --device`. SCROLL installs directly. That is the Android equivalent of a local Xcode install, and it is enough until you ship.

## Google Play Console (only for store / testers)

When you want Internal testing or a Play Store listing:

1. Open [Google Play Console](https://play.google.com/console) and pay the **one-time $25** registration.
2. Create app `com.scroll.app`.
3. Build an APK/AAB:

```bash
npx eas-cli build --profile development --platform android
```

4. Use **Internal testing** (up to 100 testers by email) or **Internal app sharing**. Testers install from the Play link, then open **SCROLL** and connect to Metro.

You do not need Play Console for USB testing on your own device.

---

## Quick reference

| What | Command |
|------|---------|
| Install app on Android phone | `npx expo run:android --device` |
| Install app on iPhone (Mac) | `npx expo run:ios --device` |
| JS bundler | `pnpm start` |
| Stripe backend | `pnpm run api` |
| Wrong app? | Open **SCROLL**, not Expo Go |
