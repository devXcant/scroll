import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { useAppStore } from '@/stores/appStore';
import { isUnlockFlowPath } from '@/lib/unlockRoutes';

/**
 * When user returns to SCROLL, refresh usage and re-evaluate per-app lock state
 * (keeps the native shield in sync). Does not force navigation. SCROLL itself
 * stays usable; only the specific over-limit app shows as locked.
 */
export function useLockOnForeground() {
  const pathname = usePathname();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      if (!useAppStore.getState().onboardingComplete) return;
      if (isUnlockFlowPath(pathname) || useAppStore.getState().unlockFlowActive) return;
      void (async () => {
        await useAppStore.getState().refreshUsage();
        await useAppStore.getState().evaluateLock();
      })();
    });
    return () => sub.remove();
  }, [pathname]);
}
