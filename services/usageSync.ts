import { AppState, Platform } from 'react-native';
import type { TrackedApp, UsageSnapshot } from '@/types';
import { screenTimeLogic } from '@/services/screenTime';
import { isExpoGo } from '@/lib/expoGo';
import { loadAppBlocker } from '@/lib/appBlocker';

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

/** Pull today’s foreground minutes from the OS (Android) or stored mock (iOS). */
export async function syncUsageFromDevice(apps: TrackedApp[]): Promise<UsageSnapshot[]> {
  if (Platform.OS === 'android' && apps.length > 0 && !isExpoGo()) {
    const byPackage = await fetchAndroidUsageMinutes(apps.map((a) => a.bundleId));
    const usage: UsageSnapshot[] = apps.map((app) => ({
      appId: app.id,
      minutesUsed: Math.max(0, Math.floor(byPackage[app.bundleId] ?? 0)),
      lastUpdated: new Date().toISOString(),
    }));
    const raw = JSON.stringify(usage);
    const { default: AsyncStorage } = await import(
      '@react-native-async-storage/async-storage'
    );
    await AsyncStorage.setItem('@scroll/usage', raw);
    return usage;
  }
  return screenTimeLogic.getUsage();
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
