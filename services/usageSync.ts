import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrackedApp, UsageSnapshot } from '@/types';
import { screenTimeLogic } from '@/services/screenTime';
import { isExpoGo } from '@/lib/expoGo';
import { loadAppBlocker, type AppBlockerModule } from '@/lib/appBlocker';

const USAGE_KEY = '@scroll/usage';

async function persistUsage(usage: UsageSnapshot[]): Promise<UsageSnapshot[]> {
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  return usage;
}

async function fetchAndroidUsageMinutes(
  packageNames: string[]
): Promise<Record<string, number>> {
  if (isExpoGo() || Platform.OS !== 'android') return {};
  const mod = loadAppBlocker();
  if (!mod?.getTodayUsageMinutes) return {};
  try {
    return await mod.getTodayUsageMinutes(packageNames);
  } catch {
    return {};
  }
}

async function fetchIosLimitHits(
  apps: TrackedApp[]
): Promise<UsageSnapshot[] | null> {
  if (isExpoGo() || Platform.OS !== 'ios') return null;
  const mod = loadAppBlocker();
  if (!mod?.getLimitHits) return null;
  let hits: { appId: string; at?: string }[] = [];
  try {
    hits = mod.getLimitHits() ?? [];
  } catch {
    return null;
  }
  if (hits.length === 0) return null;

  const existing = await screenTimeLogic.getUsage();
  const now = new Date().toISOString();
  const byApp = new Map<string, number>();
  for (const hit of hits) {
    const app = apps.find((a) => a.id === hit.appId);
    if (!app) continue;
    byApp.set(app.id, Math.max(byApp.get(app.id) ?? 0, app.dailyLimitMinutes));
  }
  if (byApp.size === 0) return null;

  return apps.map((app) => {
    const prev = existing.find((u) => u.appId === app.id);
    return {
      appId: app.id,
      minutesUsed: Math.max(prev?.minutesUsed ?? 0, byApp.get(app.id) ?? 0),
      lastUpdated: now,
    };
  });
}

export async function syncUsageFromDevice(apps: TrackedApp[]): Promise<UsageSnapshot[]> {
  if (Platform.OS === 'android' && apps.length > 0 && !isExpoGo()) {
    const byPackage = await fetchAndroidUsageMinutes(apps.map((a) => a.bundleId));
    const usage: UsageSnapshot[] = apps.map((app) => ({
      appId: app.id,
      minutesUsed: Math.max(0, Math.floor(byPackage[app.bundleId] ?? 0)),
      lastUpdated: new Date().toISOString(),
    }));
    return persistUsage(usage);
  }

  const iosHits = await fetchIosLimitHits(apps);
  if (iosHits) return persistUsage(iosHits);

  return screenTimeLogic.getUsage();
}

export async function startIosLimitMonitoring(
  apps: TrackedApp[],
  items: { type: string; token: string; bundleIdentifier?: string; displayName?: string }[]
): Promise<void> {
  if (isExpoGo() || Platform.OS !== 'ios') return;
  const mod = loadAppBlocker() as AppBlockerModule | null;
  if (!mod?.startDailyLimitMonitoring) return;

  const limits = items.flatMap((item) => {
    if (item.type !== 'app' && item.type !== 'category') return [];
    const app = apps.find(
      (a) =>
        (item.bundleIdentifier && a.bundleId === item.bundleIdentifier) ||
        (item.displayName && a.name === item.displayName) ||
        (item.type === 'category' && a.id.startsWith('cat_') && a.bundleId === item.token)
    );
    if (!app || !item.token) return [];
    return [
      {
        appId: app.id,
        token: item.token,
        minutes: Math.max(1, app.dailyLimitMinutes),
        type: item.type,
      },
    ];
  });

  try {
    await mod.startDailyLimitMonitoring(limits);
  } catch {
    /* native module may be unpatched until rebuild */
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startUsagePolling(
  getApps: () => TrackedApp[],
  onUsage: (usage: UsageSnapshot[]) => void,
  onEvaluateLock: () => Promise<void>
): () => void {
  const tick = async () => {
    if (AppState.currentState !== 'active') return;
    const apps = getApps();
    const usage = await syncUsageFromDevice(apps);
    onUsage(usage);
    await onEvaluateLock();
  };

  void tick();
  pollTimer = setInterval(() => void tick(), 15_000);

  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') void tick();
  });

  return () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    sub.remove();
  };
}
