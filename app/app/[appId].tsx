import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { DualUsageChart } from '@/components/ui/DualUsageChart';
import { TodaySplitBar } from '@/components/ui/TodaySplitBar';
import { LimitRow } from '@/components/settings/LimitRow';
import { useAppStore } from '@/stores/appStore';
import { daysFromStart, formatDayLabel } from '@/services/usageHistory';
import { locksOnDay } from '@/lib/attentionStats';
import { AppLockPanel } from '@/components/app/AppLockPanel';
import { isInGracePeriod } from '@/lib/grace';
import { findTrackedApp } from '@/lib/lockHelpers';

export default function AppDetailScreen() {
  const { appId: appIdParam } = useLocalSearchParams<{ appId: string | string[] }>();
  const rawId = Array.isArray(appIdParam) ? appIdParam.join('.') : appIdParam;
  const apps = useAppStore((s) => s.apps);
  const usage = useAppStore((s) => s.usage);
  const usageByDay = useAppStore((s) => s.usageByDay);
  const blockEvents = useAppStore((s) => s.blockEvents);
  const lock = useAppStore((s) => s.lock);
  const unlockExpiresAt = useAppStore((s) => s.unlockExpiresAt);
  const graceAppId = useAppStore((s) => s.graceAppId);
  const firstOpenDate = useAppStore((s) => s.firstOpenDate);
  const instantLockApp = useAppStore((s) => s.instantLockApp);
  const tryUpdateAppLimit = useAppStore((s) => s.tryUpdateAppLimit);
  const trySetAppLimitFromInput = useAppStore((s) => s.trySetAppLimitFromInput);
  const confirmAppLimitIncrease = useAppStore((s) => s.confirmAppLimitIncrease);
  const [confirmApp, setConfirmApp] = useState<{ id: string; name: string; minutes: number } | null>(
    null
  );

  const app = findTrackedApp(apps, rawId);
  const used = usage.find((u) => u.appId === app?.id)?.minutesUsed ?? 0;

  const chart = useMemo(() => {
    const days = daysFromStart(firstOpenDate, 7);
    return days.map((d) => ({
      label: formatDayLabel(d).slice(0, 3),
      used: usageByDay[d]?.[app?.id ?? ''] ?? 0,
      limit: app?.dailyLimitMinutes ?? 0,
      locked: locksOnDay(blockEvents, app?.id ?? '', d) > 0,
    }));
  }, [usageByDay, app?.id, app?.dailyLimitMinutes, firstOpenDate, blockEvents]);

  const blocks = useMemo(
    () => blockEvents.filter((e) => e.appId === app?.id),
    [blockEvents, app?.id]
  );

  if (!app) {
    return <Redirect href="/(tabs)" />;
  }

  const inGrace =
    isInGracePeriod(unlockExpiresAt) &&
    (graceAppId === app.id || graceAppId === app.bundleId);
  const sessionLocked =
    lock.isLocked &&
    (lock.triggeredByAppId === app.id || lock.triggeredByAppId === app.bundleId);

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
          contentContainerClassName="px-4 pb-[148px]"
          showsVerticalScrollIndicator={false}>
          <Text className="mt-2 font-display text-[32px] text-scroll-text">{app.name}</Text>
          <Text className="mb-6 font-body text-scroll-muted">
            {used}m today · your limit is {app.dailyLimitMinutes}m
          </Text>

          {sessionLocked ? <AppLockPanel app={app} /> : null}

          <GlassCard className="mb-4">
            <Text className="mb-2 font-display-semibold text-lg text-scroll-text">Today</Text>
            <TodaySplitBar used={used} limit={app.dailyLimitMinutes} />
          </GlassCard>

          <GlassCard className="mb-4">
            <Text className="mb-1 font-display-semibold text-lg text-scroll-text">
              {chart.length === 1 ? 'Today vs limit' : 'Used vs your limit'}
            </Text>
            <Text className="mb-3 font-body text-xs text-scroll-dim">
              Blue is time in {app.name}. The faint bar is the limit you set. Dots are days it locked.
            </Text>
            <DualUsageChart
              days={chart}
              highlightLast
              usedLabel="Used"
              limitLabel="Your limit"
            />
          </GlassCard>

          <View className="mb-4 flex-row gap-4">
            <GlassCard className="flex-1 items-center py-4">
              <Text className="font-display text-2xl text-scroll-text">{blocks.length}</Text>
              <Text className="mt-1 font-body text-xs text-scroll-dim">Times blocked</Text>
            </GlassCard>
            <GlassCard className="flex-1 items-center py-4">
              <Text className="font-display text-2xl text-scroll-text">
                {sessionLocked ? 'Locked' : inGrace ? 'Open' : 'No'}
              </Text>
              <Text className="mt-1 font-body text-xs text-scroll-dim">
                {inGrace ? 'Minutes remaining on home' : 'Status'}
              </Text>
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

          {sessionLocked ? null : (
            <Button iconName="lock" label="Lock this app now" onPress={lockNow} />
          )}
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
