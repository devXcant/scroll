import type { AppBlockEvent, TrackedApp, UsageSnapshot } from '@/types';
import { dateKey, daysFromStart } from '@/services/usageHistory';

export function combinedLimitMinutes(apps: TrackedApp[]): number {
  return apps.reduce((sum, app) => sum + Math.max(0, app.dailyLimitMinutes), 0);
}

export function combinedUsedMinutes(apps: TrackedApp[], usage: UsageSnapshot[]): number {
  return apps.reduce((sum, app) => {
    return sum + (usage.find((u) => u.appId === app.id)?.minutesUsed ?? 0);
  }, 0);
}

export function minutesForDay(
  apps: TrackedApp[],
  usageByDay: Record<string, Record<string, number>>,
  day: string
): number {
  const map = usageByDay[day] ?? {};
  return apps.reduce((sum, app) => sum + (map[app.id] ?? 0), 0);
}

export function withinLimitDay(
  apps: TrackedApp[],
  usageByDay: Record<string, Record<string, number>>,
  day: string
): boolean {
  const limit = combinedLimitMinutes(apps);
  if (limit <= 0) return true;
  return minutesForDay(apps, usageByDay, day) <= limit;
}

export function currentStreak(
  apps: TrackedApp[],
  usageByDay: Record<string, Record<string, number>>,
  firstOpenDate: string | null
): number {
  const days = daysFromStart(firstOpenDate, 30).slice().reverse();
  let streak = 0;
  const today = dateKey();
  for (const day of days) {
    const used = minutesForDay(apps, usageByDay, day);
    const limit = combinedLimitMinutes(apps);
    if (day === today && used === 0) {
      if (streak === 0) continue;
    }
    if (limit > 0 && used > limit) break;
    streak += 1;
  }
  return streak;
}

export function locksOnDay(events: AppBlockEvent[], appId: string, day: string): number {
  return events.filter((e) => e.appId === appId && e.at.slice(0, 10) === day).length;
}
