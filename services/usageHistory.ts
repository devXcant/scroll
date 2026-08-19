import type { DailyUsageMap, UsageSnapshot } from '@/types';

export function dateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function mergeUsageIntoDay(
  existing: Record<string, DailyUsageMap>,
  usage: UsageSnapshot[],
  day = dateKey()
): Record<string, DailyUsageMap> {
  const map: DailyUsageMap = { ...(existing[day] ?? {}) };
  for (const u of usage) {
    map[u.appId] = u.minutesUsed;
  }
  return { ...existing, [day]: map };
}

export function usageFromDay(
  history: Record<string, DailyUsageMap>,
  day: string,
  appIds: string[]
): UsageSnapshot[] {
  const map = history[day] ?? {};
  const now = new Date().toISOString();
  return appIds.map((appId) => ({
    appId,
    minutesUsed: map[appId] ?? 0,
    lastUpdated: now,
  }));
}

export function lastNDays(n: number, from = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    keys.push(dateKey(d));
  }
  return keys;
}

export function daysFromStart(startIso: string | null | undefined, maxDays = 7): string[] {
  const today = dateKey();
  if (!startIso) return [today];
  const start = dateKey(new Date(startIso));
  const startMs = new Date(`${start}T12:00:00`).getTime();
  const todayMs = new Date(`${today}T12:00:00`).getTime();
  if (Number.isNaN(startMs) || startMs > todayMs) return [today];
  const keys: string[] = [];
  for (let ms = startMs; ms <= todayMs; ms += 86400000) {
    keys.push(dateKey(new Date(ms)));
  }
  return keys.slice(-maxDays);
}

export function formatDayLabel(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  const today = dateKey();
  if (key === today) return 'Today';
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  if (key === yesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
