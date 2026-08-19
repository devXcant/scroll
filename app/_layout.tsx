import '@/global.css';
import '@/lib/nativewind-interop';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack, useRouter, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StripeRoot } from '@/components/providers/StripeRoot';
import { AppBootOverlay } from '@/components/ui/AppBootOverlay';
import { useLockOnForeground } from '@/hooks/useLockOnForeground';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useAppStore } from '@/stores/appStore';
import { appDetailPath } from '@/lib/lockHelpers';
import {
  configureNativeShieldUi,
  subscribeShieldUnlockRequests,
  syncNativeShieldWithScrollState,
} from '@/services/nativeShield';
import { configureNotifications, subscribeNotificationResponses } from '@/services/notifications';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  useLockOnForeground();
  useAppBootstrap();

  const [loaded, error] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_FORCE_ONBOARDING === 'true') {
      useAppStore.getState().resetToOnboarding();
    }
  }, []);

  useEffect(() => {
    configureNotifications();
    configureNativeShieldUi();
    const s = useAppStore.getState();
    void syncNativeShieldWithScrollState({
      shieldEnabled: s.shieldEnabled,
      isLocked: s.lock.isLocked,
      unlockExpiresAt: s.unlockExpiresAt,
      apps: s.apps,
      iosBlockedItems: s.iosBlockedItems,
      triggeredByAppId: s.lock.triggeredByAppId,
    });
    const unsub = subscribeShieldUnlockRequests(() => {
      const state = useAppStore.getState();
      if (!state.onboardingComplete) {
        router.replace('/onboarding');
        return;
      }
      if (state.lock.isLocked && state.lock.triggeredByAppId) {
        router.push(appDetailPath(state.lock.triggeredByAppId) as Href);
      } else if (state.lock.isLocked) {
        router.replace('/(tabs)');
      } else {
        router.push('/unlock/pay');
      }
    });
    const unsubNotes = subscribeNotificationResponses((url) => {
      router.push(url as Href);
    });
    return () => {
      unsub?.();
      unsubNotes();
    };
  }, [router]);

  // Stack must render on the first paint — returning null here breaks expo-router route context.
  return (
    <StripeRoot>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
      {!loaded ? <AppBootOverlay /> : null}
    </StripeRoot>
  );
}
