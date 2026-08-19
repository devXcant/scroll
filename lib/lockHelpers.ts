import { isInGracePeriod } from '@/lib/grace';
import type { LockState, TrackedApp, UsageSnapshot } from '@/types';

export function encodeAppParam(id: string): string {
  return encodeURIComponent(id.replace(/\./g, '~'));
}

export function decodeAppParam(raw: string): string {
  try {
    return decodeURIComponent(raw).replace(/~/g, '.');
  } catch {
    return raw.replace(/~/g, '.');
  }
}

export function findTrackedApp(apps: TrackedApp[], rawId: string | undefined): TrackedApp | undefined {
  if (!rawId) return undefined;
  const id = decodeAppParam(rawId);
  return apps.find(
    (a) => a.id === rawId || a.id === id || a.bundleId === rawId || a.bundleId === id
  );
}

export function getLockedApps(
  apps: TrackedApp[],
  usage: UsageSnapshot[],
  lock: LockState,
  grace?: { unlockExpiresAt?: string | null; graceAppId?: string | null }
): TrackedApp[] {
  const graceOpen = isInGracePeriod(grace?.unlockExpiresAt ?? null);
  return apps.filter((app) => {
    if (graceOpen && grace?.graceAppId && (app.id === grace.graceAppId || app.bundleId === grace.graceAppId)) {
      return false;
    }
    const used = usage.find((u) => u.appId === app.id)?.minutesUsed ?? 0;
    const atLimit = used >= app.dailyLimitMinutes;
    const sessionLocked = lock.isLocked && lock.triggeredByAppId === app.id;
    return atLimit || sessionLocked;
  });
}

export function formatLockBannerTitle(
  lockedApps: TrackedApp[],
  lock: LockState,
  apps: TrackedApp[]
): string {
  if (lockedApps.length >= 2) {
    return `${lockedApps.length} apps locked`;
  }
  const name =
    apps.find((a) => a.id === lock.triggeredByAppId)?.name ??
    lockedApps[0]?.name ??
    'An app';
  return `${name} is locked`;
}

export function isAppActivelyLocked(appId: string, lock: LockState): boolean {
  return lock.isLocked && lock.triggeredByAppId === appId;
}

export function isAppAtLimit(
  appId: string,
  apps: TrackedApp[],
  usage: UsageSnapshot[]
): boolean {
  const app = apps.find((a) => a.id === appId);
  if (!app) return false;
  const used = usage.find((u) => u.appId === appId)?.minutesUsed ?? 0;
  return used >= app.dailyLimitMinutes;
}

export function lockResolvePath(lock: LockState): string {
  if (lock.isLocked && lock.triggeredByAppId) {
    return appDetailPath(lock.triggeredByAppId);
  }
  return '/(tabs)';
}

export function appDetailPath(appId: string): string {
  return `/app/${encodeAppParam(appId)}`;
}
