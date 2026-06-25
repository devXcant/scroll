import { useCallback, useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import type { TrackedApp } from '@/types';
import { loadAppBlocker } from '@/lib/appBlocker';
import { AppPicker } from '@/components/onboarding/AppPicker';
import {
  describeIosSelection,
  isNativeBlockerModuleAvailable,
  isNativeShieldAvailable,
  trackedAppsFromIosItems,
  type IosBlockedItemSnapshot,
} from '@/services/nativeShield';
import { useAppStore } from '@/stores/appStore';

type Props = {
  selected: TrackedApp[];
  onChange: (apps: TrackedApp[]) => void;
};

export function ShieldAppPicker({ selected, onChange }: Props) {
  const iosSelectionData = useAppStore((s) => s.iosSelectionData);
  const iosBlockedItems = useAppStore((s) => s.iosBlockedItems);
  const setIosBlockSelection = useAppStore((s) => s.setIosBlockSelection);

  const [PickerView, setPickerView] = useState<
    typeof import('expo-app-blocker').FamilyActivityPickerView | null
  >(null);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !isNativeShieldAvailable()) return;
    const mod = loadAppBlocker();
    if (mod?.FamilyActivityPickerView) {
      setPickerView(() => mod.FamilyActivityPickerView);
    }
  }, []);

  const onIosSelection = useCallback(
    async (event: {
      items: IosBlockedItemSnapshot[];
      selectionData: string;
      totalApps: number;
    }) => {
      const items = event.items as IosBlockedItemSnapshot[];
      setIosBlockSelection(event.selectionData, items);
      const apps = trackedAppsFromIosItems(items);
      onChange(apps);
    },
    [onChange, setIosBlockSelection]
  );

  if (Platform.OS === 'ios' && isNativeBlockerModuleAvailable() && PickerView) {
    return (
      <View className="flex-1">
        <Text className="mb-4 font-body text-sm leading-5 text-scroll-muted">
          Pick apps SCROLL will block when you hit your limits. This uses Apple’s Screen Time
          APIs. Tap a category (Social, Games, etc.) to choose specific apps inside it.
        </Text>
        {!isNativeShieldAvailable() ? (
          <Text className="mb-3 font-body text-xs text-scroll-dim">
            Simulator note: you can select categories here, but real blocking only works on a
            physical iPhone with a SCROLL dev build.
          </Text>
        ) : null}
        <PickerView
          initialSelection={iosSelectionData}
          theme="dark"
          style={{ minHeight: 360, flex: 1 }}
          onSelectionChange={(e) => void onIosSelection(e)}
        />
        {iosBlockedItems.length > 0 ? (
          <Text className="mt-2 font-body text-xs text-scroll-accent">
            {describeIosSelection(iosBlockedItems)}
          </Text>
        ) : (
          <Text className="mt-2 font-body text-xs text-scroll-dim">
            Select apps or categories above to continue
          </Text>
        )}
      </View>
    );
  }

  if (Platform.OS === 'ios' && !isNativeShieldAvailable()) {
    return (
      <View className="flex-1">
        <Text className="mb-4 font-body text-sm leading-5 text-scroll-muted">
          Install the SCROLL dev build on a physical iPhone to pick apps with Apple’s blocker API.
          Simulator can show the list below but cannot enforce real iOS shields.
        </Text>
        <AppPicker selected={selected} onChange={onChange} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Text className="mb-4 font-body text-sm leading-5 text-scroll-muted">
        Choose apps SCROLL blocks when you go over your daily limits.
      </Text>
      <AppPicker selected={selected} onChange={onChange} />
    </View>
  );
}
