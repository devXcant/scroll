import { useEffect } from 'react';
import { dedupeTrackedApps } from '@/lib/trackedApps';
import { DEFAULT_APPS } from '@/constants/defaults';
import { useAppStore } from '@/stores/appStore';
import { startUsagePolling } from '@/services/usageSync';
import { requestNotificationsPermission } from '@/services/notifications';
import { getOrCreateDeviceUserId } from '@/services/userIdentity';
import { ensureUnlockAttemptsHydrated } from '@/services/antiCheat';
import { replacePortfolio } from '@/services/investments';
import {
  bootstrapUser,
  fetchUserProfile,
  fetchUserState,
  syncUserState,
} from '@/services/userBackend';

function looksLikeCatalogDefaults(apps: { id: string }[]): boolean {
  const ids = new Set(DEFAULT_APPS.map((a) => a.id));
  return apps.length > 0 && apps.every((a) => ids.has(a.id));
}

export function useAppBootstrap() {
  useEffect(() => {
    let stopUsage: (() => void) | null = null;

    void (async () => {
      await ensureUnlockAttemptsHydrated();
      const deviceId = await getOrCreateDeviceUserId();
      const profile = await bootstrapUser(deviceId);
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
      const local = useAppStore.getState();
      const canTakeRemoteApps =
        Boolean(remote?.apps?.length) &&
        (!local.onboardingComplete || looksLikeCatalogDefaults(local.apps));
      if (canTakeRemoteApps && remote?.apps?.length) {
        useAppStore.getState().setApps(remote.apps);
      }

      const syncCoach = true;
      if (syncCoach && remote?.coachSessions?.length) {
        useAppStore.setState({ coachSessions: remote.coachSessions.slice(0, 40) });
      }

      if (remote?.portfolio && typeof remote.portfolio === 'object') {
        const localPort = local.portfolio;
        const remotePort = remote.portfolio;
        const remoteHasValue =
          remotePort.totalInvestedCents > 0 ||
          remotePort.avoidedUnlockCents > 0 ||
          remotePort.totalUnlockFeesCents > 0;
        const localEmpty =
          localPort.totalInvestedCents === 0 &&
          localPort.avoidedUnlockCents === 0 &&
          localPort.totalUnlockFeesCents === 0;
        if (remoteHasValue && localEmpty) {
          await replacePortfolio(remotePort);
          await useAppStore.getState().loadPortfolio();
        }
      } else {
        await useAppStore.getState().loadPortfolio();
      }

      if (!profile) {
        void fetchUserProfile(deviceId);
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
