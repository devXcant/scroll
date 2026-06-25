import { ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { AppUsageRow } from '@/components/ui/AppUsageRow';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { DEFAULT_CATEGORY_LIMITS } from '@/constants/defaults';
import { formatLockBannerTitle, getLockedApps, lockResolvePath } from '@/lib/lockHelpers';
import { useAppStore } from '@/stores/appStore';

export default function FocusScreen() {
  const router = useRouter();
  const { apps, usage, lock, shieldEnabled } = useAppStore();

  const lockedApps = getLockedApps(apps, usage, lock);

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName={`px-6 pt-4 pb-[${TAB_BAR_HEIGHT + 32}px]`}
          showsVerticalScrollIndicator={false}>
          <Text className="mb-2 font-display text-[32px] text-scroll-text">Focus map</Text>
          <Text className="mb-6 font-body leading-[22px] text-scroll-muted">
            Per-app limits lock you when used time hits the cap. Category totals are shared caps.
            Resets at midnight.
          </Text>

          {lock.isLocked ? (
            <GlassCard glow className="mb-4">
              <Text className="mb-1 font-display-semibold text-base text-scroll-lock">
                {formatLockBannerTitle(lockedApps, lock, apps)}
              </Text>
              <Text className="font-body leading-5 text-scroll-muted">{lock.message}</Text>
              <Button
                variant="secondary"
                iconName="unlock"
                label="Resolve lock"
                onPress={() => router.push(lockResolvePath(lock) as Href)}
                className="mt-2"
              />
            </GlassCard>
          ) : null}

          {lockedApps.length > 0 ? (
            <GlassCard className="mb-4">
              <Text className="mb-3 font-display-semibold text-lg text-scroll-text">
                Currently locked / at limit
              </Text>
              {lockedApps.map((app) => (
                <AppUsageRow
                  key={app.id}
                  app={app}
                  usage={usage.find((u) => u.appId === app.id)}
                  sessionLocked={lock.isLocked && lock.triggeredByAppId === app.id}
                  onPress={() => router.push(`/app/${app.id}`)}
                />
              ))}
            </GlassCard>
          ) : null}

          <GlassCard className="mb-4">
            <Text className="mb-2 font-display-semibold text-lg text-scroll-text">
              Your tracked apps
            </Text>
            {apps.length === 0 ? (
              <Text className="font-body text-sm text-scroll-dim">
                No apps selected. Add them in Settings.
              </Text>
            ) : (
              apps.map((app) => (
                <AppUsageRow
                  key={app.id}
                  app={app}
                  usage={usage.find((u) => u.appId === app.id)}
                  sessionLocked={lock.isLocked && lock.triggeredByAppId === app.id}
                  onPress={() => router.push(`/app/${app.id}`)}
                />
              ))
            )}
            {!shieldEnabled ? (
              <Text className="mt-4 font-body text-xs leading-[18px] text-scroll-dim">
                Shield shows SETUP on Home until you grant blocking access in Settings.
              </Text>
            ) : null}
          </GlassCard>

          <Text className="mb-4 font-display-semibold text-lg text-scroll-text">Categories</Text>

          {DEFAULT_CATEGORY_LIMITS.map((cat) => {
            const catApps = apps.filter((a) => a.category === cat.category);
            const used = catApps.reduce(
              (sum, a) => sum + (usage.find((u) => u.appId === a.id)?.minutesUsed ?? 0),
              0
            );
            const pct = Math.min(1, used / cat.dailyLimitMinutes);
            return (
              <GlassCard key={cat.category} className="mb-4">
                <View className="mb-3 flex-row justify-between">
                  <Text className="font-display-semibold text-lg text-scroll-text">{cat.label}</Text>
                  <Text className="font-body text-scroll-muted">
                    {used} / {cat.dailyLimitMinutes}m
                  </Text>
                </View>
                <View className="h-1.5 overflow-hidden rounded-sm bg-scroll-surface">
                  <View className="h-full bg-scroll-accent" style={{ width: `${Math.round(pct * 100)}%` }} />
                </View>
                <Text className="mt-2.5 font-body text-xs text-scroll-dim">
                  {catApps.length > 0
                    ? catApps.map((a) => a.name).join(' · ')
                    : 'No tracked apps in this category'}
                </Text>
              </GlassCard>
            );
          })}

          <GlassCard className="mb-6 mt-4">
            <Text className="mb-2 font-display-semibold text-scroll-amber">How locking works</Text>
            <Text className="font-body leading-[22px] text-scroll-muted">
              Each app has its own daily limit. When SCROLL counts that much use, you get locked and
              blocked apps show the SCROLL overlay.
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
