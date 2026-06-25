import { isExpoGo } from '@/lib/expoGo';

export type AppBlockerModule = typeof import('expo-app-blocker');

/** Lazy-load expo-app-blocker — unavailable in Expo Go. */
export function loadAppBlocker(): AppBlockerModule | null {
  if (isExpoGo()) return null;
  try {
    return require('expo-app-blocker') as AppBlockerModule;
  } catch {
    return null;
  }
}
