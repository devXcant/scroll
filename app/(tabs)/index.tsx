import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { MotiView } from 'moti';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { InsightPills } from '@/components/ui/InsightPills';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AppUsageRow } from '@/components/ui/AppUsageRow';
import { LockedAppCard } from '@/components/ui/LockedAppCard';
import { UnlockTile } from '@/components/ui/UnlockTile';
import { LockCountdown } from '@/components/ui/LockCountdown';
import { DayStrip } from '@/components/ui/DayStrip';
import { DualUsageChart } from '@/components/ui/DualUsageChart';
import {
  combinedLimitMinutes,
  combinedUsedMinutes,
  currentStreak,
  minutesForDay,
} from '@/lib/attentionStats';
import { isPlusActive, plusLabel } from '@/constants/plus';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/cn';
import { appDetailPath, formatLockBannerTitle, getLockedApps, lockResolvePath } from '@/lib/lockHelpers';
import { useAppStore } from '@/stores/appStore';
import { isInGracePeriod } from '@/lib/grace';
import { dateKey, formatDayLabel, daysFromStart } from '@/services/usageHistory';
import { greetingName } from '@/lib/defaultDisplayName';

export default function HomeScreen() {
  const router = useRouter();
  const {
    apps,
    lock,
    refreshUsage,
    evaluateLock,
    shieldEnabled,
    unlockExpiresAt,
    graceAppId,
    lockEndsAt,
    lockMinEndsAt,
    usage,
    usageByDay,
    selectedHistoryDate,
    setSelectedHistoryDate,
    scrollPoints,
    userDisplayName,
    signedInProfile,
    firstOpenDate,
    inbox,
    plusExpiresAt,
    plusTrialEndsAt,
    plusPlan,
  } = useAppStore();

  const today = dateKey();
  const displayUsage = useMemo(() => {
    const day = selectedHistoryDate || today;
    if (day === today) return usage;
    const map = usageByDay[day] ?? {};
    const now = new Date().toISOString();
    return apps.map((a) => ({
      appId: a.id,
      minutesUsed: map[a.id] ?? 0,
      lastUpdated: now,
    }));
  }, [apps, usage, usageByDay, selectedHistoryDate, today]);

  const isToday = selectedHistoryDate === today;
  const dayKeys = useMemo(() => daysFromStart(firstOpenDate, 7), [firstOpenDate]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await refreshUsage();
        await evaluateLock();
      })();
    }, [refreshUsage, evaluateLock])
  );

  const firstName = greetingName(userDisplayName || signedInProfile?.displayName);

  const lockedApps = useMemo(() => {
    if (!isToday) return [];
    return getLockedApps(apps, usage, lock, { unlockExpiresAt, graceAppId });
  }, [apps, usage, lock, isToday, unlockExpiresAt, graceAppId]);

  const weekChart = useMemo(() => {
    const cap = combinedLimitMinutes(apps);
    return dayKeys.map((d) => ({
      label: formatDayLabel(d).slice(0, 3),
      used: minutesForDay(apps, usageByDay, d),
      limit: cap,
    }));
  }, [apps, usageByDay, dayKeys]);

  const streak = useMemo(
    () => currentStreak(apps, usageByDay, firstOpenDate),
    [apps, usageByDay, firstOpenDate]
  );
  const todayUsed = combinedUsedMinutes(apps, displayUsage);
  const todayCap = combinedLimitMinutes(apps);
  const plusOn = isPlusActive({ plusExpiresAt, plusTrialEndsAt });

  const lockBannerTitle = formatLockBannerTitle(lockedApps, lock, apps);

  const graceLeft = unlockExpiresAt
    ? Math.max(0, Math.round((new Date(unlockExpiresAt).getTime() - Date.now()) / 60000))
    : 0;
  const overallPct = todayCap > 0 ? todayUsed / todayCap : 0;

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="pt-4 pb-[148px]" showsVerticalScrollIndicator={false}>
          <View className="px-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-body text-sm text-scroll-dim">
                  {isToday ? 'Today' : formatDayLabel(selectedHistoryDate)}
                </Text>
                <Text className="mt-1 font-display text-[32px] text-scroll-text">
                  {firstName ? `Hey, ${firstName}` : 'Hey there'}
                </Text>
                {streak > 0 ? (
                  <Text className="mt-1 font-body-medium text-sm text-scroll-accent">
                    {streak} day{streak === 1 ? '' : 's'} under your cap
                  </Text>
                ) : (
                  <Text className="mt-1 font-body text-sm text-scroll-muted">
                    Small days still count
                  </Text>
                )}
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => router.push('/plus')}
                  className="rounded-full border border-scroll-accent/50 bg-scroll-accent/20 px-3 py-2">
                  <Text className="font-body-medium text-[10px] text-scroll-accent">
                    {plusOn ? plusLabel({ plusPlan, plusExpiresAt, plusTrialEndsAt }) : 'Plus'}
                  </Text>
                </Pressable>
                <GlassIconButton
                  icon="bell"
                  onPress={() => router.push('/inbox')}
                  color={inbox.some((i) => !i.read) ? colors.lock : colors.icon}
                  accessibilityLabel="Inbox"
                  glow={inbox.some((i) => !i.read)}
                />
                <GlassIconButton
                  icon="settings"
                  onPress={() => router.push('/settings')}
                  color={colors.icon}
                  accessibilityLabel="Settings"
                />
              </View>
            </View>

            <DayStrip days={dayKeys} selected={selectedHistoryDate} onSelect={setSelectedHistoryDate} />

            <InsightPills
              items={[
                {
                  value: streak > 0 ? `${streak}d` : '—',
                  label: 'Under cap',
                },
                {
                  value: `${Math.max(0, todayCap - todayUsed)}m`,
                  label: 'Left today',
                },
                {
                  value: `${scrollPoints}`,
                  label: 'Points',
                },
              ]}
            />

            {isToday && lock.isLocked ? (
              <GlassCard glow className="mt-4">
                <View className="mb-1.5 flex-row items-center gap-2">
                  <ScrollIcon name="lock" size={16} color={colors.lock} />
                  <Text className="font-display-semibold text-base text-scroll-lock">
                    {lockBannerTitle}
                  </Text>
                </View>
                <Text className="font-body leading-5 text-scroll-muted">
                  {lock.message ||
                    (lockedApps.length >= 2
                      ? `${lockedApps.length} apps hit their daily caps.`
                      : `${lockedApps[0]?.name ?? 'An app'} hit its daily cap.`)}
                </Text>
                {lockEndsAt ? (
                  <LockCountdown lockEndsAt={lockEndsAt} lockMinEndsAt={lockMinEndsAt} compact />
                ) : null}
                <Button
                  variant="secondary"
                  iconName="unlock"
                  label="Resolve lock"
                  onPress={() => router.push(lockResolvePath(lock) as Href)}
                  className="mt-2"
                />
              </GlassCard>
            ) : null}

            {isToday && lockedApps.length > 0 ? (
              <View className="mt-4">
                <Text className="mb-2 font-display-semibold text-base text-scroll-text">
                  {lockedApps.length === 1 ? 'Locked / at limit' : `${lockedApps.length} apps locked`}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="pr-4">
                  {lockedApps.map((app) => (
                    <LockedAppCard
                      key={app.id}
                      app={app}
                      usage={usage.find((u) => u.appId === app.id)}
                      sessionLocked={lock.isLocked && lock.triggeredByAppId === app.id}
                      onPress={() => router.push(appDetailPath(app.id) as Href)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {isToday && graceLeft > 0 ? (
              <GlassCard glow className="mt-4">
                <Text className="font-display-semibold text-base text-scroll-text">
                  {apps.find((a) => a.id === graceAppId)?.name ?? 'Your app'} is open
                </Text>
                <Text className="mt-1 font-body text-sm text-scroll-muted">
                  {graceLeft} minutes left before the limit applies again
                </Text>
              </GlassCard>
            ) : null}

            {isToday && !lock.isLocked && lockedApps.length === 0 ? (
              <GlassCard glow className="mt-4 items-center">
                <LottieView
                  source={require('@/assets/lottie/phone-scroll.json')}
                  autoPlay
                  loop
                  style={{ width: 140, height: 140 }}
                />
                <Text className="font-display-semibold text-base text-scroll-text">
                  Nice. You are still in control
                </Text>
                <Text className="mt-1 text-center font-body text-sm text-scroll-muted">
                  No apps locked. Keep the streak going.
                </Text>
              </GlassCard>
            ) : null}

            <View className="my-6 flex-row items-center gap-6">
              <ProgressRing
                progress={1 - Math.min(1, overallPct)}
                label={`${todayUsed}m`}
                sublabel={todayCap > 0 ? `of ${todayCap}m cap` : 'no cap yet'}
                color={overallPct >= 1 ? colors.lock : '#4C8DFF'}
              />
              <View className="flex-1 gap-1.5">
                <Text className="font-body text-xs text-scroll-dim">{scrollPoints} points</Text>
                <Text
                  className={cn(
                    'font-display text-2xl',
                    shieldEnabled ? 'text-scroll-accent' : 'text-scroll-muted'
                  )}>
                  {shieldEnabled ? 'On' : 'Set up'}
                </Text>
                <Text className="font-body text-sm text-scroll-muted">
                  {isToday
                    ? lock.isLocked
                      ? 'An app is paused'
                      : overallPct < 0.7
                        ? 'Plenty of room left'
                        : 'Getting close to your cap'
                    : 'Past day snapshot'}
                </Text>
              </View>
            </View>

            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}>
            <GlassCard className="mb-6">
              <Text className="mb-1 font-display-semibold text-lg text-scroll-text">
                {dayKeys.length === 1 ? 'Today vs your cap' : 'Week vs your cap'}
              </Text>
              <Text className="mb-3 font-body text-xs text-scroll-dim">
                Blue is minutes across tracked apps. The faint bar is your combined daily limits.
              </Text>
              <DualUsageChart
                days={weekChart}
                highlightLast={isToday}
                usedLabel="Used"
                limitLabel="Combined cap"
              />
            </GlassCard>
            </MotiView>

            <GlassCard className="mb-6">
              <Text className="mb-2 font-display-semibold text-lg text-scroll-text">Your apps</Text>
              <Text className="mb-2 font-body text-xs text-scroll-dim">
                Tap one to see used vs limit, and days it locked
              </Text>
              {apps.length === 0 ? (
                <Text className="font-body text-sm text-scroll-dim">
                  No apps tracked yet. Finish onboarding or add apps in Settings.
                </Text>
              ) : (
                apps.map((app) => (
                  <AppUsageRow
                    key={app.id}
                    app={app}
                    usage={displayUsage.find((u) => u.appId === app.id)}
                    inGrace={
                      isToday &&
                      isInGracePeriod(unlockExpiresAt) &&
                      (graceAppId === app.id || graceAppId === app.bundleId)
                    }
                    sessionLocked={isToday && lock.isLocked && lock.triggeredByAppId === app.id}
                    onPress={() => router.push(appDetailPath(app.id) as Href)}
                  />
                ))
              )}
            </GlassCard>

            {isToday ? (
              <>
                <Text className="mb-4 font-display-semibold text-lg text-scroll-text">
                  Earn a little time
                </Text>
                <View className="flex-row flex-wrap gap-4">
                  <UnlockTile
                    iconName="book-open"
                    title="Read"
                    subtitle="A few pages"
                    onPress={() => router.push('/unlock/read')}
                  />
                  <UnlockTile
                    iconName="layers"
                    title="Learn"
                    subtitle="Short lessons"
                    onPress={() => router.push('/unlock/learn')}
                  />
                  {lock.isLocked ? (
                    <UnlockTile
                      iconName="credit-card"
                      title="Pay unlock"
                      subtitle="Opens the app for a bit"
                      wide
                      onPress={() => router.push('/unlock/pay')}
                    />
                  ) : null}
                </View>
              </>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
