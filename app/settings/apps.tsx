import { useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Button } from '@/components/ui/Button';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { ShieldAppPicker } from '@/components/onboarding/ShieldAppPicker';
import { useAppStore } from '@/stores/appStore';
import { persistIosBlockSelection } from '@/services/nativeShield';
import type { TrackedApp } from '@/types';
import { FREE_TRACKED_APP_CAP, isPlusActive } from '@/constants/plus';

export default function ManageAppsScreen() {
  const router = useRouter();
  const apps = useAppStore((s) => s.apps);
  const iosSelectionData = useAppStore((s) => s.iosSelectionData);
  const iosBlockedItems = useAppStore((s) => s.iosBlockedItems);
  const setApps = useAppStore((s) => s.setApps);
  const plusExpiresAt = useAppStore((s) => s.plusExpiresAt);
  const plusTrialEndsAt = useAppStore((s) => s.plusTrialEndsAt);
  const plusOn = isPlusActive({ plusExpiresAt, plusTrialEndsAt });
  const [picked, setPicked] = useState<TrackedApp[]>(apps);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!plusOn && picked.length > FREE_TRACKED_APP_CAP) {
      Alert.alert(
        'SCROLL Plus',
        `Free tracks ${FREE_TRACKED_APP_CAP} apps. Plus unlocks as many as you want.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'See Plus', onPress: () => router.push('/plus') },
        ]
      );
      return;
    }
    setSaving(true);
    setApps(picked);
    if (Platform.OS === 'ios' && iosBlockedItems.length > 0) {
      await persistIosBlockSelection(iosSelectionData, iosBlockedItems);
    }
    setSaving(false);
    router.back();
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-4 pt-2">
          <ScreenBackButton />
        </View>
        <View className="flex-1 px-4 pb-8">
          <Text className="mb-2 mt-2 font-display text-[32px] text-scroll-text">Tracked apps</Text>
          <Text className="mb-4 font-body text-sm leading-5 text-scroll-muted">
            Pick what SCROLL should stop when you hit a limit.
          </Text>
          <View className="min-h-[280px] flex-1">
            <ShieldAppPicker selected={picked} onChange={setPicked} />
          </View>
          <Button label="Save" loading={saving} onPress={() => void save()} disabled={picked.length === 0} />
          <Button variant="ghost" label="Cancel" onPress={() => router.back()} className="mt-2" />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
