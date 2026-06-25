import { useEffect } from 'react';
import { dedupeTrackedApps } from '@/lib/trackedApps';
import { useAppStore } from '@/stores/appStore';
import { startUsagePolling } from '@/services/usageSync';
import { requestNotificationsPermission } from '@/services/notifications';
import { getOrCreateDeviceUserId } from '@/services/userIdentity';
import {
  bootstrapUser,
  fetchUserState,
  syncUserState,
} from '@/services/userBackend';

export function useAppBootstrap() {
  useEffect(() => {
    let stopUsage: (() => void) | null = null;

    void (async () => {
      const deviceId = await getOrCreateDeviceUserId();
      await bootstrapUser(deviceId);
      await useAppStore.getState().loadScrollPointsBalance();
      if (useAppStore.getState().onboardingComplete) {
        void requestNotificationsPermission();
      }

      const localApps = useAppStore.getState().apps;
      const deduped = dedupeTrackedApps(localApps);
      if (deduped.length !== localApps.length || deduped.some((a, i) => a.id !== localApps[i]?.id)) {
        useAppStore.setState({ apps: deduped });
      }

      const remote = await fetchUserState(deviceId);
      if (remote?.apps?.length) {
        useAppStore.getState().setApps(remote.apps);
      }
      if (remote?.coachSessions?.length) {
        useAppStore.setState({ coachSessions: remote.coachSessions.slice(0, 40) });
      }

      stopUsage = startUsagePolling(
        () => useAppStore.getState().apps,
        (usage) => useAppStore.setState({ usage }),
        async () => {
          await useAppStore.getState().evaluateLock();
        }
      );
    })();

    const syncInterval = setInterval(() => {
      void (async () => {
        const deviceId = await getOrCreateDeviceUserId();
        const s = useAppStore.getState();
        await syncUserState(deviceId, {
          apps: s.apps,
          usage: s.usage,
          portfolio: s.portfolio,
          coachSessions: s.coachSessions,
          onboardingComplete: s.onboardingComplete,
        });
      })();
    }, 60_000);

    return () => {
      stopUsage?.();
      clearInterval(syncInterval);
    };
  }, []);
}
