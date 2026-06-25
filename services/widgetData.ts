/**
 * Bridges SCROLL's lock/usage state to the home screen widgets.
 *
 * iOS: writes JSON to the shared App Group via ExtensionStorage, then asks
 * WidgetKit to reload. Android: re-renders the react-native-android-widget
 * widget directly and persists the same summary for the headless task handler.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LockState, TrackedApp, UsageSnapshot } from '@/types';

const APP_GROUP = 'group.com.scroll.app.blocker';
const WIDGET_DATA_KEY = 'scroll.widget.summary.v1';
export const WIDGET_STORAGE_KEY = '@scroll/widget_summary';
export const ANDROID_WIDGET_NAME = 'ScrollWidget';

export type WidgetSummary = {
  lockedCount: number;
  lockedAppNames: string[];
  totalTracked: number;
  activeLockApp: string | null;
  lockEndsAt: string | null;
  updatedAt: string;
};

export const EMPTY_WIDGET_SUMMARY: WidgetSummary = {
  lockedCount: 0,
  lockedAppNames: [],
  totalTracked: 0,
  activeLockApp: null,
  lockEndsAt: null,
  updatedAt: '',
};

export function buildWidgetSummary(
  apps: TrackedApp[],
  usage: UsageSnapshot[],
  lock: LockState,
  lockEndsAt: string | null
): WidgetSummary {
  const lockedApps = apps.filter((app) => {
    const used = usage.find((u) => u.appId === app.id)?.minutesUsed ?? 0;
    const atLimit = used >= app.dailyLimitMinutes;
    const sessionLocked = lock.isLocked && lock.triggeredByAppId === app.id;
    return atLimit || sessionLocked;
  });

  return {
    lockedCount: lockedApps.length,
    lockedAppNames: lockedApps.map((a) => a.name),
    totalTracked: apps.length,
    activeLockApp: lock.isLocked
      ? apps.find((a) => a.id === lock.triggeredByAppId)?.name ?? null
      : null,
    lockEndsAt: lock.isLocked ? lockEndsAt : null,
    updatedAt: new Date().toISOString(),
  };
}

export async function syncWidgetData(summary: WidgetSummary): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(summary));
  } catch {
    /* ignore */
  }

  if (Platform.OS === 'ios') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ExtensionStorage } = require('@bacons/apple-targets');
      const storage = new ExtensionStorage(APP_GROUP);
      storage.set(WIDGET_DATA_KEY, JSON.stringify(summary));
      ExtensionStorage.reloadWidget();
    } catch {
      /* native module unavailable (Expo Go, web) */
    }
  } else if (Platform.OS === 'android') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { requestWidgetUpdate } = require('react-native-android-widget');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ScrollWidget } = require('@/components/widgets/ScrollWidget');
      await requestWidgetUpdate({
        widgetName: ANDROID_WIDGET_NAME,
        renderWidget: () => ScrollWidget({ summary }),
      });
    } catch {
      /* native module unavailable */
    }
  }
}
