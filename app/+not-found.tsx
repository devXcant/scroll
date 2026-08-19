import { Redirect, type Href } from 'expo-router';
import { lockResolvePath } from '@/lib/lockHelpers';
import { useAppStore } from '@/stores/appStore';

export default function NotFoundScreen() {
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const lock = useAppStore((s) => s.lock);

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }
  if (lock.isLocked) {
    return <Redirect href={lockResolvePath(lock) as Href} />;
  }
  return <Redirect href="/(tabs)" />;
}
