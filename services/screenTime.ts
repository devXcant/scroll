/**
 * Screen time limits + lock evaluation.
 * OS-level blocking is applied via services/nativeShield.ts (expo-app-blocker).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppCategory, LockReason, LockState, TrackedApp, UsageSnapshot } from '@/types';
import { DEFAULT_APPS, DEFAULT_CATEGORY_LIMITS } from '@/constants/defaults';

const USAGE_KEY = '@scroll/usage';
const SHIELD_KEY = '@scroll/shield_enabled';

export type ScreenTimeProvider = {
  requestPermissions(): Promise<boolean>;
  isShieldEnabled(): Promise<boolean>;
  setShieldEnabled(enabled: boolean): Promise<void>;
  getUsage(): Promise<UsageSnapshot[]>;
  simulateUsage(appId: string, minutes: number): Promise<void>;
  evaluateLimits(
    apps: TrackedApp[],
    usage: UsageSnapshot[]
  ): { shouldLock: boolean; reason: LockReason; appId?: string; category?: AppCategory; message: string } | null;
};

function sumCategoryMinutes(
  apps: TrackedApp[],
  usage: UsageSnapshot[],
  category: AppCategory
): number {
  const appIds = new Set(apps.filter((a) => a.category === category).map((a) => a.id));
  return usage
    .filter((u) => appIds.has(u.appId))
    .reduce((sum, u) => sum + u.minutesUsed, 0);
}

export const screenTimeLogic: ScreenTimeProvider = {
  async requestPermissions() {
    await AsyncStorage.setItem(SHIELD_KEY, 'true');
    return true;
  },

  async isShieldEnabled() {
    const v = await AsyncStorage.getItem(SHIELD_KEY);
    return v === 'true';
  },

  async setShieldEnabled(enabled: boolean) {
    await AsyncStorage.setItem(SHIELD_KEY, enabled ? 'true' : 'false');
  },

  async getUsage() {
    const raw = await AsyncStorage.getItem(USAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as UsageSnapshot[];
    } catch {
      return [];
    }
  },

  async simulateUsage(appId: string, minutes: number) {
    const usage = await this.getUsage();
    const existing = usage.find((u) => u.appId === appId);
    if (existing) {
      existing.minutesUsed = minutes;
      existing.lastUpdated = new Date().toISOString();
    } else {
      usage.push({
        appId,
        minutesUsed: minutes,
        lastUpdated: new Date().toISOString(),
      });
    }
    await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  },

  evaluateLimits(apps, usage) {
    for (const app of apps) {
      const u = usage.find((x) => x.appId === app.id);
      if (u && u.minutesUsed >= app.dailyLimitMinutes) {
        return {
          shouldLock: true,
          reason: 'app_limit',
          appId: app.id,
          message: `${app.name} hit your ${app.dailyLimitMinutes}m limit.`,
        };
      }
    }
    for (const cat of DEFAULT_CATEGORY_LIMITS) {
      const total = sumCategoryMinutes(apps, usage, cat.category);
      if (total >= cat.dailyLimitMinutes) {
        return {
          shouldLock: true,
          reason: 'category_limit',
          category: cat.category,
          message: `${cat.label} hit your ${cat.dailyLimitMinutes}m daily cap.`,
        };
      }
    }
    return null;
  },
};

export async function checkAndBuildLockState(
  apps: TrackedApp[] = DEFAULT_APPS,
  usageOverride?: UsageSnapshot[]
): Promise<LockState> {
  const usage = usageOverride ?? (await screenTimeLogic.getUsage());
  const result = screenTimeLogic.evaluateLimits(apps, usage);
  if (!result?.shouldLock) {
    return {
      isLocked: false,
      reason: null,
      lockedAt: null,
      triggeredByAppId: null,
      triggeredCategory: null,
      message: '',
    };
  }
  return {
    isLocked: true,
    reason: result.reason,
    lockedAt: new Date().toISOString(),
    triggeredByAppId: result.appId ?? null,
    triggeredCategory: result.category ?? null,
    message: result.message,
  };
}
