import { Alert, Platform } from 'react-native';
import { isExpoGo } from '@/lib/expoGo';
import { loadAppBlocker } from '@/lib/appBlocker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { catalogEntryForPackage } from '@/constants/androidPackages';
import { openAndroidUsageAccessSettings, permissionBlockedReason } from '@/services/devicePermissions';
import type { AppCategory, TrackedApp } from '@/types';

const PERMISSION_KEY = '@scroll/app_list_permission';
const CACHE_KEY = '@scroll/discovered_apps';

/** Packages we never show in the picker (phone, launcher, SCROLL itself). */
const ANDROID_HIDDEN_PACKAGES = new Set([
  'com.scroll.app',
  'com.android.settings',
  'com.android.dialer',
  'com.google.android.dialer',
  'com.android.phone',
  'com.google.android.apps.nexuslauncher',
  'com.google.android.apps.docs',
]);

function slugId(packageOrBundle: string): string {
  return packageOrBundle.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
}

function guessCategory(packageName: string, label: string): AppCategory {
  const hay = `${packageName} ${label}`.toLowerCase();
  if (/game|roblox|clash|candy|pubg|minecraft|fortnite|among/.test(hay)) {
    return 'games';
  }
  if (
    /youtube|netflix|twitch|spotify|disney|hulu|prime video|hbo|peacock/.test(hay)
  ) {
    return 'entertainment';
  }
  if (
    /instagram|tiktok|twitter|facebook|snap|reddit|discord|telegram|whatsapp|linkedin|pinterest|social|x\.com/.test(
      hay
    )
  ) {
    return 'social';
  }
  return 'other';
}

function isAndroidHiddenPackage(pkg: string): boolean {
  const p = pkg.toLowerCase();
  if (ANDROID_HIDDEN_PACKAGES.has(p)) return true;
  if (p.includes('launcher') && p.startsWith('com.')) return true;
  return false;
}

function trackedFromAndroidPackage(packageName: string, label: string): TrackedApp {
  const known = catalogEntryForPackage(packageName);
  if (known) {
    return {
      id: slugId(packageName),
      name: known.name,
      bundleId: packageName,
      category: known.category,
      dailyLimitMinutes: known.dailyLimitMinutes,
    };
  }
  return {
    id: slugId(packageName),
    name: label,
    bundleId: packageName,
    category: guessCategory(packageName, label),
    dailyLimitMinutes: 60,
  };
}

async function loadAndroidInstalledApps(): Promise<TrackedApp[]> {
  if (isExpoGo()) return [];
  const mod = loadAppBlocker();
  if (!mod?.getInstalledApps) return [];
  try {
    const raw = await mod.getInstalledApps();
    const apps: TrackedApp[] = [];
    for (const row of raw) {
      const pkg = row.packageName?.trim();
      const label = row.name?.trim();
      if (!pkg || !label || isAndroidHiddenPackage(pkg)) continue;
      apps.push(trackedFromAndroidPackage(pkg, label));
    }
    return apps.sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.warn('[appDiscovery] getInstalledApps failed', e);
    return [];
  }
}

export async function hasAppListPermission(): Promise<boolean> {
  if (Platform.OS === 'android') return true;
  const v = await AsyncStorage.getItem(PERMISSION_KEY);
  return v === 'true';
}

/** Load installed apps from the device (Android) or catalog merge (iOS / fallback). */
export async function requestAppListPermission(): Promise<boolean> {
  const blocked = permissionBlockedReason();
  if (blocked) {
    Alert.alert('Dev build required', blocked, [{ text: 'OK' }]);
    await refreshDiscoveredApps();
    return true;
  }

  await refreshDiscoveredApps();
  await AsyncStorage.setItem(PERMISSION_KEY, 'true');

  if (Platform.OS === 'android') {
    const count = (await getSelectableApps()).length;
    if (count === 0) {
      Alert.alert(
        'No apps found',
        'SCROLL could not read installed apps. Allow Usage access, then tap Refresh list.',
        [
          {
            text: 'Usage access',
            onPress: () => void openAndroidUsageAccessSettings(),
          },
          { text: 'OK' },
        ]
      );
    }
    return true;
  }

  Alert.alert(
    'Choose your apps',
    'On the next step, pick the apps SCROLL should block when you hit your limits.',
    [{ text: 'OK' }]
  );
  return true;
}

export async function refreshDiscoveredApps(): Promise<TrackedApp[]> {
  if (Platform.OS === 'android') {
    const installed = await loadAndroidInstalledApps();
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(installed));
    return installed;
  }

  const { APP_CATALOG } = await import('@/constants/appCatalog');
  const merged: TrackedApp[] = APP_CATALOG.filter((a) => !a.isSystem).map((app) => ({
    id: app.id,
    name: app.name,
    bundleId: app.bundleId,
    category: app.category,
    dailyLimitMinutes: app.dailyLimitMinutes,
  }));
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged));
  return merged;
}

export async function getSelectableApps(): Promise<TrackedApp[]> {
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as TrackedApp[];
      if (parsed.length > 0) {
        void refreshDiscoveredApps();
        return parsed;
      }
    } catch {
      /* refresh */
    }
  }
  return refreshDiscoveredApps();
}

export function searchSelectableApps(
  apps: TrackedApp[],
  query: string
): TrackedApp[] {
  const q = query.trim().toLowerCase();
  if (!q) return apps;
  return apps.filter(
    (app) =>
      app.name.toLowerCase().includes(q) ||
      app.bundleId.toLowerCase().includes(q)
  );
}
