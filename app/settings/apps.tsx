import { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Button } from '@/components/ui/Button';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { ShieldAppPicker } from '@/components/onboarding/ShieldAppPicker';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { useAppStore } from '@/stores/appStore';
import { persistIosBlockSelection } from '@/services/nativeShield';
import type { TrackedApp } from '@/types';

export default function ManageAppsScreen() {
  const router = useRouter();
  const apps = useAppStore((s) => s.apps);
  const iosSelectionData = useAppStore((s) => s.iosSelectionData);
  const iosBlockedItems = useAppStore((s) => s.iosBlockedItems);
  const setApps = useAppStore((s) => s.setApps);
  const [picked, setPicked] = useState<TrackedApp[]>(apps);
  const [saving, setSaving] = useState(false);

  const save = async () => {
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
        <ScrollView
          contentContainerClassName="flex-grow px-4 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text className="mb-2 mt-2 font-display text-[32px] text-scroll-text">Tracked apps</Text>
          <Text className="mb-4 font-body text-sm leading-5 text-scroll-muted">
            Apps you pick here are the ones SCROLL monitors and can shield when limits hit.
          </Text>
          <View className="min-h-[420px] flex-1">
            <ShieldAppPicker selected={picked} onChange={setPicked} />
          </View>
          <Button label="Save" loading={saving} onPress={() => void save()} disabled={picked.length === 0} />
          <Button variant="ghost" label="Cancel" onPress={() => router.back()} className="mt-2" />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
