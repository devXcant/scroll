# SCROLL Native Shield (iOS & Android)

Expo Go **cannot** block other apps. Production requires `expo-dev-client` + native modules.

## iOS — Family Controls

1. Request **Family Controls** entitlement from Apple (App Store category: productivity / health).
2. Add capability in Xcode: Family Controls, Managed Settings.
3. Implement native module wrapping:
   - `AuthorizationCenter.shared.requestAuthorization`
   - `DeviceActivityMonitor` for schedules
   - `ManagedSettingsStore` to shield `ApplicationToken`s
4. Map JS `TrackedApp.bundleId` → `FamilyActivitySelection`.

References: Apple `FamilyControls`, `DeviceActivity`, `ManagedSettings`.

## Android — Usage + overlay

1. `UsageStatsManager` — `PACKAGE_USAGE_STATS` (user grants in Settings).
2. Foreground service + overlay or AccessibilityService to show lock UI when limit exceeded.
3. Optional: Device Admin for kiosk-style lock (heavy UX; use sparingly).

## JS bridge contract

Implement the same interface as `services/screenTime.ts` (`ScreenTimeProvider`):

```ts
requestPermissions(): Promise<boolean>
getUsage(): Promise<UsageSnapshot[]>
setShieldEnabled(enabled: boolean): Promise<void>
```

Replace mock `AsyncStorage` usage with native events (push usage every minute).

## Anti-circumvention (production)

- Block Settings uninstall path via MDM only for enterprise; consumer apps rely on OS APIs.
- Server-side payment webhook before `unlock()` in pay flow.
- VPN / clock tamper: trust server time for pay cooldowns when online.

## 3-day launch path

| Day | Work |
|-----|------|
| 1 | This Expo UI + flows (done) — TestFlight internal with mock shield |
| 2 | EAS dev build + iOS Family Controls spike OR Android usage stats |
| 3 | Stripe backend + App Store metadata + privacy policy |
