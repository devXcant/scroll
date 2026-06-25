import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { LimitRow, limitHintText } from '@/components/settings/LimitRow';
import { useAppStore } from '@/stores/appStore';
import { MAX_APP_LIMIT_MINUTES } from '@/types';
import { screenTimeLogic } from '@/services/screenTime';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    apps,
    tryUpdateAppLimit,
    trySetAppLimitFromInput,
    confirmAppLimitIncrease,
    requestShieldPermissions,
    shieldEnabled,
  } = useAppStore();

  const [confirmApp, setConfirmApp] = useState<{
    id: string;
    name: string;
    minutes: number;
  } | null>(null);

  const syncShield = useCallback(async () => {
    const enabled = await screenTimeLogic.isShieldEnabled();
    if (enabled !== useAppStore.getState().shieldEnabled) {
      useAppStore.setState({ shieldEnabled: enabled });
    }
  }, []);

  useEffect(() => {
    void syncShield();
  }, [syncShield]);

  const applyLimitResult = (
    appId: string,
    result: { ok: boolean; needsConfirm?: boolean; reason?: string },
    minutes: number,
    appName: string
  ) => {
    if (result.needsConfirm) {
      setConfirmApp({ id: appId, name: appName, minutes });
      return;
    }
    if (!result.ok && result.reason) {
      Alert.alert('Limit locked for today', result.reason);
    }
  };

  const changeLimit = (appId: string, minutes: number) => {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    const result = tryUpdateAppLimit(appId, minutes);
    applyLimitResult(appId, result, minutes, app.name);
  };

  const submitLimit = (appId: string, raw: string) => {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    const parsed = Number.parseInt(raw.trim(), 10);
    const result = trySetAppLimitFromInput(appId, raw);
    applyLimitResult(appId, result, parsed, app.name);
  };

  const onShieldPress = async () => {
    await requestShieldPermissions();
    await syncShield();
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="p-6 pb-12"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-scroll-text font-display text-[32px] mb-6">Settings</Text>

          <GlassCard className="mb-6">
            <Text className="text-scroll-text font-display-semibold mb-2">
              Per-app limits (max {MAX_APP_LIMIT_MINUTES}m / day)
            </Text>
            <Text className="text-scroll-dim font-body text-xs leading-[18px] mb-4">
              {limitHintText()}
            </Text>
            {apps.map((app) => (
              <LimitRow
                key={app.id}
                app={app}
                onChangeLimit={changeLimit}
                onSubmitLimit={submitLimit}
              />
            ))}
          </GlassCard>

          <Button
            label="Profile & account"
            variant="secondary"
            iconName="user"
            onPress={() => router.push('/(tabs)/profile')}
            className="mb-4"
          />

          <Button
            label="Choose tracked apps"
            variant="secondary"
            iconName="grid"
            onPress={() => router.push('/settings/apps')}
            className="mb-4"
          />

          <Button
            label={
              shieldEnabled
                ? 'App blocking on · tap to review permissions'
                : 'Enable app blocking'
            }
            variant="secondary"
            onPress={() => void onShieldPress()}
          />

          <Button
            variant="ghost"
            label="Close"
            onPress={() => router.back()}
            className="mt-6"
          />
        </ScrollView>

        <Modal visible={confirmApp !== null} transparent animationType="fade">
          <View className="flex-1 bg-black/65 justify-center p-6">
            <GlassCard className="p-6">
              <Text className="text-scroll-text font-display-semibold text-lg mb-2">
                Increase daily limit?
              </Text>
              <Text className="text-scroll-muted font-body leading-[22px] mb-6">
                You can only set {confirmApp?.name}'s limit once per day. After you confirm,
                you cannot change it again until midnight.
              </Text>
              <View className="flex-row gap-2">
                <Button
                  variant="ghost"
                  label="Cancel"
                  onPress={() => setConfirmApp(null)}
                  className="flex-1"
                />
                <Button
                  label="Confirm"
                  onPress={() => {
                    if (confirmApp) {
                      confirmAppLimitIncrease(confirmApp.id, confirmApp.minutes);
                    }
                    setConfirmApp(null);
                  }}
                  className="flex-1"
                />
              </View>
            </GlassCard>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}
