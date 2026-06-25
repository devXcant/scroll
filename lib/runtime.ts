import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isExpoGo } from '@/lib/expoGo';

/** True when running the native SCROLL dev/production binary (not Expo Go). */
export function isScrollNativeBuild(): boolean {
  return (
    Constants.executionEnvironment === 'bare' ||
    Constants.executionEnvironment === 'standalone'
  );
}

export function isIosSimulator(): boolean {
  if (Platform.OS !== 'ios') return false;
  const constants = Platform.constants as { simulator?: boolean } | undefined;
  return constants?.simulator === true;
}

export function shieldEnvironmentLabel(): string {
  if (isExpoGo()) return 'expo-go';
  if (isIosSimulator()) return 'simulator';
  if (isScrollNativeBuild()) return 'device';
  return 'unknown';
}
