# SCROLL

Anti–doom-scrolling mobile app built with **Expo** and **React Native**. Set app & category limits, get locked when you exceed them, and earn unlocks through reading, micro-lessons, or escalating pay-to-unlock (80% routed to an investment bucket).

## Run locally

```bash
pnpm install
pnpm start
```

### Metro (Expo SDK 54)

```bash
pnpm start
```

This project targets **Expo SDK 54** (`expo@~54`, `expo-router@~6`). Use a **development build** (`expo-dev-client` + Stripe), not Expo Go — see [docs/RUN_ON_PHONE.md](./docs/RUN_ON_PHONE.md).

```bash
pnpm start:dev   # after installing the dev build on a device/simulator
```

### Dev build (Stripe + Apple Pay)

| Goal | Command |
|------|---------|
| Android | `pnpm run:android` |
| iOS + Xcode | `pnpm run:ios` |
| iPhone, no Xcode | `npx eas-cli build --profile development --platform ios` |

Then use `pnpm start:dev` (not `--go`).

- Locking is triggered when tracked app usage reaches its limit.
- **Native blocking (iOS + Android):** SCROLL blocks apps you pick when limits hit — see [docs/IOS_SHIELD.md](./docs/IOS_SHIELD.md). Rebuild after pulling: `export APPLE_TEAM_ID=… && npx expo prebuild --clean && npx expo run:ios --device`.

## App structure

| Area | Path |
|------|------|
| Screens | `app/` — onboarding, tabs, lock, unlock flows |
| State | `stores/appStore.ts` |
| Screen time API | `services/screenTime.ts` |
| Payments | `services/payments.ts` |
| AI coach | `services/aiCoach.ts` |
| Anti-cheat | `services/antiCheat.ts` |
| UI | `components/ui/` |

## AI coach (how it fits)

Not a general chatbot. SCROLL Coach:

- Explains lock reasons and nudges **read → learn → pay** (last resort).
- Answers where unlock fees go (80% investment split).
- Gives 90-second resets and habit tips.
- Wire `EXPO_PUBLIC_OPENROUTER_API_KEY` in `.env` (see `.env.example`), restart Expo.

## Payments (Stripe + Apple Pay)

1. **Terminal 1 — API** (secret key in `server/.env` only):
   ```bash
   pnpm api:install
   pnpm run api
   ```
2. **Terminal 2 — app** (publishable key in `.env`):
   ```bash
   pnpm start
   ```
3. Pay unlock opens **Stripe Payment Sheet** — Apple Pay (double-click side button on iPhone) + cards.
4. **Physical iPhone:** set `EXPO_PUBLIC_API_URL=http://YOUR_MAC_LAN_IP:3001`
5. **Requires dev build** (`expo-dev-client`), not Expo Go, for native Stripe.
6. Register **Apple Pay merchant** `merchant.com.scroll.app` in [Stripe Dashboard](https://dashboard.stripe.com) + Apple Developer.
7. Escalating tiers: $1 → $5 → $10 → $20 → $50; server confirms payment before unlock.

## Native blocking

Real phone lock requires a **development build**, not Expo Go. See [docs/NATIVE_SHIELD.md](./docs/NATIVE_SHIELD.md).

```bash
npx expo install expo-dev-client
eas build --profile development --platform ios
```

## 3-day launch checklist

- [ ] Privacy policy + Terms (payments, investments, Screen Time data)
- [ ] Backend: Stripe webhooks, investment ledger partner, `/coach` API
- [ ] EAS production builds + App Store / Play Console
- [ ] Apple Family Controls entitlement approved
- [ ] Android usage access UX tested on Pixel + Samsung

## Legal note

Investment copy is illustrative. Partner with a licensed custodian; do not hold user funds without compliance review.




Profile → turn on Usage + Overlay → open system settings and allow both.
Settings → find Chrome → tap middle field → type 2 → save.
Enable app blocking if shield still says SETUP.
Use Chrome ~2 minutes (stay in Chrome).
SCROLL should lock and show the SCROLL overlay when you open Chrome again.

