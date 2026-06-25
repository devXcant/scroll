import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { UsageBarChart } from '@/components/ui/UsageBarChart';
import { LimitRow } from '@/components/settings/LimitRow';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { useAppStore } from '@/stores/appStore';
import { lastNDays, formatDayLabel } from '@/services/usageHistory';
import { AppLockPanel } from '@/components/app/AppLockPanel';
import { isInGracePeriod } from '@/lib/grace';

export default function AppDetailScreen() {
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const apps = useAppStore((s) => s.apps);
  const usage = useAppStore((s) => s.usage);
  const usageByDay = useAppStore((s) => s.usageByDay);
  const blockEvents = useAppStore((s) => s.blockEvents);
  const lock = useAppStore((s) => s.lock);
  const unlockExpiresAt = useAppStore((s) => s.unlockExpiresAt);
  const instantLockApp = useAppStore((s) => s.instantLockApp);
  const tryUpdateAppLimit = useAppStore((s) => s.tryUpdateAppLimit);
  const trySetAppLimitFromInput = useAppStore((s) => s.trySetAppLimitFromInput);
  const confirmAppLimitIncrease = useAppStore((s) => s.confirmAppLimitIncrease);
  const [confirmApp, setConfirmApp] = useState<{ id: string; name: string; minutes: number } | null>(
    null
  );

  const app = apps.find((a) => a.id === appId);
  const used = usage.find((u) => u.appId === appId)?.minutesUsed ?? 0;

  const chart = useMemo(() => {
    const days = lastNDays(7);
    const values = days.map((d) => usageByDay[d]?.[appId ?? ''] ?? 0);
    const labels = days.map((d) => formatDayLabel(d).slice(0, 3));
    return { values, labels, max: Math.max(app?.dailyLimitMinutes ?? 60, ...values) };
  }, [usageByDay, appId, app?.dailyLimitMinutes]);

  const blocks = useMemo(
    () => blockEvents.filter((e) => e.appId === appId),
    [blockEvents, appId]
  );

  if (!app) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 px-4 pt-4 gap-4">
          <ScreenBackButton />
          <Text className="font-display text-[32px] text-scroll-text">App not found</Text>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const inGrace = isInGracePeriod(unlockExpiresAt);
  const sessionLocked = lock.isLocked && lock.triggeredByAppId === app.id;

  const applyLimitResult = (
    result: { ok: boolean; needsConfirm?: boolean; reason?: string },
    minutes: number
  ) => {
    if (result.needsConfirm) {
      setConfirmApp({ id: app.id, name: app.name, minutes });
      return;
    }
    if (!result.ok && result.reason) Alert.alert('Limit', result.reason);
  };

  const lockNow = () => {
    const result = instantLockApp(app.id);
    if (!result.ok) {
      Alert.alert('Could not lock', result.reason ?? 'Try again');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-4 pt-2">
          <ScreenBackButton />
        </View>
        <ScrollView
          contentContainerClassName={`px-4 pb-[${TAB_BAR_HEIGHT + 32}px]`}
          showsVerticalScrollIndicator={false}>
          <Text className="mt-2 font-display text-[32px] text-scroll-text">{app.name}</Text>
          <Text className="mb-6 font-body text-scroll-muted">
            {used}m of {app.dailyLimitMinutes}m today · {app.category}
          </Text>

          {sessionLocked ? <AppLockPanel app={app} /> : null}

          <GlassCard className="mb-4">
            <Text className="mb-4 font-display-semibold text-lg text-scroll-text">Last 7 days</Text>
            <UsageBarChart
              values={chart.values}
              labels={chart.labels}
              maxMinutes={chart.max}
              barClassName={used >= app.dailyLimitMinutes ? 'bg-scroll-lock' : 'bg-scroll-accent'}
              highlightLast
            />
          </GlassCard>

          <View className="mb-4 flex-row gap-4">
            <GlassCard className="flex-1 items-center py-4">
              <Text className="font-display text-2xl text-scroll-text">{blocks.length}</Text>
              <Text className="mt-1 font-body text-xs text-scroll-dim">Times blocked</Text>
            </GlassCard>
            <GlassCard className="flex-1 items-center py-4">
              <Text className="font-display text-2xl text-scroll-text">
                {sessionLocked ? 'Yes' : inGrace ? 'Grace' : 'No'}
              </Text>
              <Text className="mt-1 font-body text-xs text-scroll-dim">Locked now</Text>
            </GlassCard>
          </View>

          <GlassCard className="mb-4">
            <Text className="mb-2 font-display-semibold text-lg text-scroll-text">Daily limit</Text>
            <LimitRow
              app={app}
              onChangeLimit={(id, minutes) => {
                applyLimitResult(tryUpdateAppLimit(id, minutes), minutes);
              }}
              onSubmitLimit={(id, raw) => {
                applyLimitResult(trySetAppLimitFromInput(id, raw), Number.parseInt(raw, 10));
              }}
            />
          </GlassCard>

          <GlassCard className="mb-4">
            <Text className="mb-4 font-display-semibold text-lg text-scroll-text">Recent blocks</Text>
            {blocks.length === 0 ? (
              <Text className="font-body text-scroll-dim">No blocks recorded yet for this app.</Text>
            ) : (
              blocks.slice(0, 8).map((e) => (
                <View
                  key={e.id}
                  className="flex-row justify-between border-t border-white/[0.04] py-2.5">
                  <Text className="font-body text-sm text-scroll-muted">
                    {new Date(e.at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text className="font-body-medium text-sm text-scroll-lock">
                    {e.reason === 'manual' ? 'Instant lock' : 'Limit reached'}
                  </Text>
                </View>
              ))
            )}
          </GlassCard>

          <Button iconName="lock" label="Lock this app now" onPress={lockNow} />
        </ScrollView>

        {confirmApp ? (
          <View className="absolute inset-0 items-center justify-center bg-black/70 px-6">
            <GlassCard className="w-full">
              <Text className="mb-2 font-display-semibold text-lg text-scroll-text">Raise limit?</Text>
              <Text className="mb-4 font-body leading-5 text-scroll-muted">
                Increase {confirmApp.name} to {confirmApp.minutes}m today?
              </Text>
              <Button
                label="Confirm"
                onPress={() => {
                  confirmAppLimitIncrease(confirmApp.id, confirmApp.minutes);
                  setConfirmApp(null);
                }}
              />
              <Button variant="ghost" label="Cancel" onPress={() => setConfirmApp(null)} className="mt-2" />
            </GlassCard>
          </View>
        ) : null}
      </SafeAreaView>
    </GradientBackground>
  );
}
