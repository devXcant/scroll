import { useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AppUsageRow } from '@/components/ui/AppUsageRow';
import { LockedAppCard } from '@/components/ui/LockedAppCard';
import { UnlockTile } from '@/components/ui/UnlockTile';
import { LockCountdown } from '@/components/ui/LockCountdown';
import { DayStrip } from '@/components/ui/DayStrip';
import { UsageBarChart } from '@/components/ui/UsageBarChart';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/cn';
import { formatLockBannerTitle, getLockedApps, lockResolvePath } from '@/lib/lockHelpers';
import { useAppStore } from '@/stores/appStore';
import { DEFAULT_CATEGORY_LIMITS } from '@/constants/defaults';
import { isInGracePeriod } from '@/lib/grace';
import { dateKey, formatDayLabel, lastNDays } from '@/services/usageHistory';
import { greetingName } from '@/lib/defaultDisplayName';
import { requestNotificationsPermission } from '@/services/notifications';

export default function HomeScreen() {
  const router = useRouter();
  const {
    apps,
    lock,
    refreshUsage,
    evaluateLock,
    shieldEnabled,
    unlockExpiresAt,
    lockEndsAt,
    lockMinEndsAt,
    usage,
    usageByDay,
    selectedHistoryDate,
    setSelectedHistoryDate,
    scrollPoints,
    userDisplayName,
    signedInProfile,
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
  const dayKeys = useMemo(() => lastNDays(7), []);

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
    return getLockedApps(apps, usage, lock);
  }, [apps, usage, lock, isToday]);

  const weekChart = useMemo(() => {
    const values = dayKeys.map((d) =>
      apps.reduce((sum, a) => sum + (usageByDay[d]?.[a.id] ?? 0), 0)
    );
    const labels = dayKeys.map((d) => formatDayLabel(d).slice(0, 3));
    return { values, labels };
  }, [apps, usageByDay, dayKeys]);

  const lockBannerTitle = formatLockBannerTitle(lockedApps, lock, apps);

  const socialUsed = apps
    .filter((a) => a.category === 'social')
    .reduce((sum, a) => sum + (displayUsage.find((u) => u.appId === a.id)?.minutesUsed ?? 0), 0);
  const socialLimit = DEFAULT_CATEGORY_LIMITS.find((c) => c.category === 'social')!
    .dailyLimitMinutes;
  const socialPct = socialLimit > 0 ? socialUsed / socialLimit : 0;

  const graceLeft = unlockExpiresAt
    ? Math.max(0, Math.round((new Date(unlockExpiresAt).getTime() - Date.now()) / 60000))
    : 0;

  const enableNotifications = () => {
    void requestNotificationsPermission().then((granted) => {
      if (!granted) {
        Alert.alert('Notifications', 'Enable notifications in Settings to get lock alerts.');
      }
    });
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="pt-4 pb-[120px]" showsVerticalScrollIndicator={false}>
          <View className="px-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-body text-sm text-scroll-dim">
                  {isToday ? 'Today' : formatDayLabel(selectedHistoryDate)}
                </Text>
                <Text className="mt-1 font-display text-[32px] text-scroll-text">
                  {firstName ? `Hello, ${firstName}` : 'Your attention'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="font-body-medium text-xs text-scroll-accent">{scrollPoints} pts</Text>
                <Pressable
                  onPress={enableNotifications}
                  className="h-11 w-11 items-center justify-center rounded-full border border-scroll-border bg-scroll-surface">
                  <ScrollIcon
                    name="bell"
                    size={20}
                    color={lock.isLocked ? colors.lock : colors.icon}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/settings')}
                  className="h-11 w-11 items-center justify-center rounded-full border border-scroll-border bg-scroll-surface">
                  <ScrollIcon name="settings" size={20} color={colors.icon} />
                </Pressable>
              </View>
            </View>

            <DayStrip days={dayKeys} selected={selectedHistoryDate} onSelect={setSelectedHistoryDate} />

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
                      onPress={() => router.push(`/app/${app.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {isToday && graceLeft > 0 ? (
              <GlassCard glow className="mt-4">
                <Text className="font-body-medium text-scroll-muted">
                  App access grace: {graceLeft}m remaining
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
                  You're in control today
                </Text>
                <Text className="mt-1 text-center font-body text-sm text-scroll-muted">
                  No apps locked. Keep it that way.
                </Text>
              </GlassCard>
            ) : null}

            <View className="my-6 flex-row items-center gap-6">
              <ProgressRing
                progress={1 - Math.min(1, socialPct)}
                label={`${socialUsed}m`}
                sublabel={`of ${socialLimit}m social`}
                color={socialPct >= 1 ? colors.lock : colors.iconActive}
              />
              <View className="flex-1 gap-1.5">
                <Text className="font-body text-xs text-scroll-dim">Shield</Text>
                <Text
                  className={cn(
                    'font-display text-2xl',
                    shieldEnabled ? 'text-scroll-accent' : 'text-scroll-muted'
                  )}>
                  {shieldEnabled ? 'ACTIVE' : 'SETUP'}
                </Text>
                <Text className="font-body text-sm text-scroll-muted">
                  {isToday
                    ? lock.isLocked
                      ? 'Locked now'
                      : 'Within limits'
                    : 'Past day snapshot'}
                </Text>
              </View>
            </View>

            <GlassCard className="mb-6">
              <Text className="mb-1 font-display-semibold text-lg text-scroll-text">Last 7 days</Text>
              <Text className="mb-3 font-body text-xs text-scroll-dim">Total minutes across tracked apps</Text>
              <UsageBarChart
                values={weekChart.values}
                labels={weekChart.labels}
                maxMinutes={120}
                highlightLast={isToday}
              />
            </GlassCard>

            <GlassCard className="mb-6">
              <Text className="mb-2 font-display-semibold text-lg text-scroll-text">Tracked apps</Text>
              <Text className="mb-2 font-body text-xs text-scroll-dim">
                From your phone selection · tap for charts and limits
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
                    inGrace={isToday && isInGracePeriod(unlockExpiresAt)}
                    sessionLocked={isToday && lock.isLocked && lock.triggeredByAppId === app.id}
                    onPress={() => router.push(`/app/${app.id}`)}
                  />
                ))
              )}
            </GlassCard>

            {isToday ? (
              <>
                <Text className="mb-4 font-display-semibold text-lg text-scroll-text">
                  Earn your scroll
                </Text>
                <View className="flex-row flex-wrap gap-4">
                  <UnlockTile
                    iconName="book-open"
                    title="Read"
                    subtitle="Earn points · no feed"
                    onPress={() => router.push('/unlock/read')}
                  />
                  <UnlockTile
                    iconName="layers"
                    title="Learn"
                    subtitle="From your Coach topics"
                    onPress={() => router.push('/unlock/learn')}
                  />
                  {lock.isLocked ? (
                    <UnlockTile
                      iconName="credit-card"
                      title="Pay unlock"
                      subtitle="Last resort · gets pricier"
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
