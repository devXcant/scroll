# SCROLL native app blocking (iOS & Android)

SCROLL blocks the apps you pick when you hit your limits. This is **not** manual “App Limits” in iPhone Settings — SCROLL drives the shield via `expo-app-blocker`.

## Requirements

- **Development build** (`npx expo run:ios` / `run:android`) — not Expo Go
- **Physical iPhone** for real iOS shields (simulator = in-app demo only)
- **Apple Developer**: Family Controls + App Group on 4 bundle IDs (see below)

## One-time setup

### Install native build

```bash
pnpm install
export APPLE_TEAM_ID=YOUR_10_CHAR_TEAM_ID   # required for iOS prebuild
npx expo prebuild --clean
npx expo run:ios --device
# or
npx expo run:android --device
```

### Apple Developer Portal (iOS)

Register these App IDs with **Family Controls** and App Group `group.com.scroll.app.blocker`:

- `com.scroll.app`
- `com.scroll.app.DeviceActivityMonitor`
- `com.scroll.app.ShieldAction`
- `com.scroll.app.ShieldConfiguration`

Use **Family Controls (Development)** in Xcode until Apple approves distribution:
https://developer.apple.com/contact/request/family-controls-distribution

### In the app

1. Onboarding → **Grant blocking access** (Screen Time on iOS; Usage + overlay on Android)
2. **Choose apps** — iOS: Apple’s in-app picker; Android: installed-app list
3. Set per-app limits in SCROLL — when exceeded, SCROLL locks and **blocks those apps at the OS**

## How it works

| Platform | API | When locked |
|----------|-----|-------------|
| iOS | FamilyControls + ManagedSettings | Shield overlay on selected apps |
| Android | UsageStats + overlay service | Full-screen block + notification |

Unlock flows call `temporaryUnlock` (iOS) or clear the block list (Android) for the earned window.

## Troubleshooting

- **Only Siri / Cellular in SCROLL settings** — normal until Screen Time permission is granted in onboarding
- **Blocks don’t appear** — rebuild after adding `expo-app-blocker`; confirm `APPLE_TEAM_ID` and entitlements
- **Expo Go** — cannot block other apps; use the SCROLL dev client from `expo run:ios`
