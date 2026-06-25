import type { LockState, TrackedApp, UsageSnapshot } from '@/types';

export function getLockedApps(
  apps: TrackedApp[],
  usage: UsageSnapshot[],
  lock: LockState
): TrackedApp[] {
  return apps.filter((app) => {
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
    return `/app/${lock.triggeredByAppId}`;
  }
  return '/(tabs)';
}
