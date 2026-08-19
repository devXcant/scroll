import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import { isExpoGo } from '@/lib/expoGo';
import { isIosSimulator, isScrollNativeBuild } from '@/lib/runtime';
import {
  isNativeBlockerModuleAvailable,
  requestNativeShieldAuthorization,
} from '@/services/nativeShield';
import { loadAppBlocker } from '@/lib/appBlocker';
import { getNotificationsGranted } from '@/services/notifications';

const SCROLL_BUNDLE =
  Platform.OS === 'ios'
    ? Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.scroll.app'
    : Constants.expoConfig?.android?.package ?? 'com.scroll.app';

export function permissionBlockedReason(): string | null {
  if (isExpoGo()) {
    if (isIosSimulator()) {
      return (
        'You opened this in Expo Go on the Simulator.\n\n' +
        'In Terminal:\n' +
        '  npx expo run:ios\n\n' +
        'Then open the SCROLL app on the simulator home screen (not the Expo Go icon).'
      );
    }
    return (
      'Install the SCROLL dev build:\n' +
      '  npx expo run:ios --device\n' +
      'or\n' +
      '  npx expo run:android --device\n\n' +
      'Expo Go cannot block other apps.'
    );
  }
  return null;
}

/** Opens the correct settings for this app — never Expo Go’s settings. */
export async function openScrollAppSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: `package:${SCROLL_BUNDLE}` }
      );
      return;
    } catch {
      await Linking.openSettings();
      return;
    }
  }
  await Linking.openSettings();
}

export async function openAndroidUsageAccessSettings(): Promise<void> {
  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.USAGE_ACCESS_SETTINGS' as IntentLauncher.ActivityAction
    );
  } catch {
    await Linking.openSettings();
  }
}

/**
 * Request OS permissions so SCROLL can block other apps (not manual Apple App Limits).
 */
export async function grantShieldAccess(): Promise<boolean> {
  const blocked = permissionBlockedReason();
  if (blocked) {
    Alert.alert('Use the SCROLL app', blocked);
    return false;
  }

  if (isIosSimulator()) {
    if (isNativeBlockerModuleAvailable()) {
      return requestNativeShieldAuthorization();
    }
    return new Promise((resolve) => {
      Alert.alert(
        'Simulator limitation',
        'Real app blocking needs a physical iPhone with a SCROLL dev build. The simulator cannot enforce iOS shields.',
        [{ text: 'OK', onPress: () => resolve(false) }]
      );
    });
  }

  if (isNativeBlockerModuleAvailable()) {
    return requestNativeShieldAuthorization();
  }

  if (isScrollNativeBuild()) {
    Alert.alert(
      'Rebuild required',
      'Native blocking is not linked in this build. Run:\n\nnpx expo prebuild --clean\nnpx expo run:ios --device\n\n(or run:android)',
      [{ text: 'OK' }]
    );
    return false;
  }

  return false;
}

export type OsPermissionSnapshot = {
  shieldEnabled: boolean;
  usageStats: boolean;
  overlay: boolean;
  notifications: boolean;
};

export async function readOsPermissions(): Promise<OsPermissionSnapshot> {
  const notifications = await getNotificationsGranted();
  const empty: OsPermissionSnapshot = {
    shieldEnabled: false,
    usageStats: false,
    overlay: false,
    notifications,
  };
  const mod = loadAppBlocker();
  if (!mod) return empty;
  try {
    const status = await mod.getPermissionStatus();
    if (status.details.platform === 'android') {
      return {
        shieldEnabled: status.details.overlay && status.details.usageStats,
        usageStats: status.details.usageStats,
        overlay: status.details.overlay,
        notifications: status.details.notifications || notifications,
      };
    }
    return {
      shieldEnabled: status.details.authorized,
      usageStats: status.details.authorized,
      overlay: false,
      notifications,
    };
  } catch {
    return empty;
  }
}
