import { Alert, Platform } from 'react-native';
import type { TrackedApp } from '@/types';
import { loadAppBlocker, type AppBlockerModule } from '@/lib/appBlocker';
import { isIosSimulator } from '@/lib/runtime';
import { openAndroidUsageAccessSettings } from '@/services/devicePermissions';
import {
  trackedAppsFromIosItems as buildTrackedAppsFromIosItems,
  type IosBlockedItemSnapshot,
} from '@/lib/trackedApps';

export type { IosBlockedItemSnapshot };

export type AndroidBlockerStatus = {
  overlay: boolean;
  usageStats: boolean;
  notifications: boolean;
  blockedPackages: string[];
};

function loadBlocker(): AppBlockerModule | null {
  return loadAppBlocker();
}

/** True when expo-app-blocker native module is linked (picker may work on simulator). */
export function isNativeBlockerModuleAvailable(): boolean {
  return loadBlocker() !== null;
}

/** True when OS shields can be enforced (device, not simulator). */
export function isNativeShieldAvailable(): boolean {
  return isNativeBlockerModuleAvailable() && !isIosSimulator();
}

export function configureNativeShieldUi(): void {
  const mod = loadBlocker();
  if (!mod || Platform.OS !== 'android') return;
  mod.configureAndroid({
    overlayTitle: 'SCROLL',
    overlayText: '{appName} is locked. Open SCROLL to earn time back.',
    overlayBackgroundColor: '#06070D',
    overlayTitleColor: '#F4F4F8',
    overlayTextColor: '#9CA3AF',
    notificationTitle: 'SCROLL',
    notificationText: 'Tap to open SCROLL and unlock.',
  });
}

export async function getAndroidBlockerStatus(): Promise<AndroidBlockerStatus | null> {
  const mod = loadBlocker();
  if (!mod || Platform.OS !== 'android') return null;
  const status = await mod.getPermissionStatus();
  if (status.details.platform !== 'android') return null;
  return {
    overlay: status.details.overlay,
    usageStats: status.details.usageStats,
    notifications: status.details.notifications,
    blockedPackages: mod.getBlockedApps(),
  };
}

export async function requestNativeShieldAuthorization(): Promise<boolean> {
  const mod = loadBlocker();
  if (!mod) return false;

  if (Platform.OS === 'ios') {
    const { allGranted } = await mod.requestPermissions();
    return allGranted;
  }

  const status = await mod.getPermissionStatus();
  if (status.allGranted) return true;

  const details = status.details;
  if (details.platform !== 'android') return false;

  return new Promise((resolve) => {
    Alert.alert(
      'Allow SCROLL to block apps',
      'SCROLL needs Usage access and Display over other apps so it can stop Chrome and other tracked apps when you hit a limit.',
      [
        {
          text: 'Usage access',
          onPress: () => mod.openUsageStatsSettings(),
        },
        {
          text: 'Display over apps',
          onPress: () => mod.openOverlaySettings(),
        },
        {
          text: 'Done',
          onPress: async () => {
            const next = await mod.getPermissionStatus();
            resolve(next.allGranted);
          },
        },
      ]
    );
  });
}

/** Prompt if overlay/usage missing — call from lock screen. */
export async function ensureAndroidCanBlockOverlay(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const status = await getAndroidBlockerStatus();
  if (!status) return false;
  if (status.overlay && status.usageStats) return true;

  return new Promise((resolve) => {
    Alert.alert(
      'SCROLL cannot block Chrome yet',
      'Turn on Usage access and Display over other apps for SCROLL. Without overlay permission, limits only show inside SCROLL.',
      [
        {
          text: 'Usage access',
          onPress: () => {
            openAndroidUsageAccessSettings();
            resolve(false);
          },
        },
        {
          text: 'Display over apps',
          onPress: () => {
            const mod = loadBlocker();
            mod?.openOverlaySettings();
            resolve(false);
          },
        },
        { text: 'Later', style: 'cancel', onPress: () => resolve(false) },
      ]
    );
  });
}

export function trackedAppsFromIosItems(items: IosBlockedItemSnapshot[]): TrackedApp[] {
  return buildTrackedAppsFromIosItems(items);
}

export function describeIosSelection(items: IosBlockedItemSnapshot[]): string {
  const apps = items.filter((i) => i.type === 'app').length;
  const categories = items.filter((i) => i.type === 'category').length;
  const parts: string[] = [];
  if (categories > 0) {
    parts.push(`${categories} categor${categories === 1 ? 'y' : 'ies'}`);
  }
  if (apps > 0) {
    parts.push(`${apps} app${apps === 1 ? '' : 's'}`);
  }
  if (parts.length === 0) return 'Nothing selected yet';
  return `${parts.join(' · ')} selected for SCROLL limits`;
}

export async function persistIosBlockSelection(
  selectionData: string,
  items: IosBlockedItemSnapshot[]
): Promise<void> {
  const mod = loadBlocker();
  if (!mod || Platform.OS !== 'ios') return;
  await mod.setBlockConfiguration({
    blockedItems: items as import('expo-app-blocker').IOSBlockedItem[],
    isActive: false,
  });
  void selectionData;
}

function applyAndroidBlocks(mod: AppBlockerModule, apps: TrackedApp[]): void {
  const packages = apps.map((a) => a.bundleId).filter(Boolean);
  mod.setBlockedApps(packages);
  mod.startMonitoring();
  if (__DEV__) {
    console.log('[nativeShield] Android blocked packages:', packages);
  }
}

export async function syncNativeShieldWithScrollState(params: {
  shieldEnabled: boolean;
  isLocked: boolean;
  unlockExpiresAt: string | null;
  apps: TrackedApp[];
  iosBlockedItems: IosBlockedItemSnapshot[];
  triggeredByAppId?: string | null;
}): Promise<void> {
  const mod = loadBlocker();
  if (!mod || isIosSimulator()) return;

  const unlockActive =
    params.unlockExpiresAt != null && new Date(params.unlockExpiresAt) > new Date();

  const triggeredApp = params.triggeredByAppId
    ? params.apps.find((a) => a.id === params.triggeredByAppId)
    : undefined;

  const iosItemsForLock = (() => {
    if (!triggeredApp || params.iosBlockedItems.length === 0) return params.iosBlockedItems;
    const byBundle = params.iosBlockedItems.filter(
      (i) => i.type === 'app' && i.bundleIdentifier === triggeredApp.bundleId
    );
    if (byBundle.length > 0) return byBundle;
    const byCategory = params.iosBlockedItems.filter(
      (i) => i.type === 'category' && triggeredApp.id.startsWith('cat_')
    );
    if (byCategory.length > 0) return byCategory;
    return params.iosBlockedItems;
  })();

  if (unlockActive && params.unlockExpiresAt) {
    const minutes = Math.max(
      1,
      Math.ceil(
        (new Date(params.unlockExpiresAt).getTime() - Date.now()) / (60 * 1000)
      )
    );
    if (Platform.OS === 'ios' && params.iosBlockedItems.length > 0) {
      await mod.temporaryUnlock(minutes);
    } else if (Platform.OS === 'android') {
      mod.setBlockedApps([]);
    }
    return;
  }

  if (params.isLocked && triggeredApp) {
    if (Platform.OS === 'ios' && iosItemsForLock.length > 0) {
      await mod.setBlockConfiguration({
        blockedItems: iosItemsForLock as import('expo-app-blocker').IOSBlockedItem[],
        isActive: true,
      });
    } else if (Platform.OS === 'android' && triggeredApp.bundleId) {
      mod.setBlockedApps([triggeredApp.bundleId]);
      mod.startMonitoring();
    }
    return;
  }

  if (params.isLocked) {
    if (Platform.OS === 'ios' && params.iosBlockedItems.length > 0) {
      await mod.setBlockConfiguration({
        blockedItems: params.iosBlockedItems as import('expo-app-blocker').IOSBlockedItem[],
        isActive: true,
      });
    } else if (Platform.OS === 'android' && params.apps.length > 0) {
      applyAndroidBlocks(mod, params.apps);
    }
    return;
  }

  if (Platform.OS === 'ios') {
    if (params.iosBlockedItems.length > 0) {
      await mod.setBlockConfiguration({
        blockedItems: params.iosBlockedItems as import('expo-app-blocker').IOSBlockedItem[],
        isActive: false,
      });
    } else {
      mod.clearAllBlocks();
    }
  } else {
    mod.setBlockedApps([]);
  }
}

export function subscribeShieldUnlockRequests(onOpen: () => void): (() => void) | null {
  const mod = loadBlocker();
  if (!mod || Platform.OS !== 'ios') return null;
  if (mod.checkAndClearPendingUnlock()) onOpen();
  const sub = mod.addPendingUnlockListener(onOpen);
  return () => sub?.remove();
}
