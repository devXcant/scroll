import { isExpoGo } from '@/lib/expoGo';

export type LimitHit = { appId: string; at?: string };

export type DailyLimitSpec = {
  appId: string;
  token: string;
  minutes: number;
  type: string;
};

export type AppBlockerModule = typeof import('expo-app-blocker') & {
  getTodayUsageMinutes?: (packageNames: string[]) => Promise<Record<string, number>>;
  getLimitHits?: () => LimitHit[];
  clearLimitHits?: () => void;
  startDailyLimitMonitoring?: (limits: DailyLimitSpec[]) => Promise<void>;
};

export function loadAppBlocker(): AppBlockerModule | null {
  if (isExpoGo()) return null;
  try {
    return require('expo-app-blocker') as AppBlockerModule;
  } catch {
    return null;
  }
}
