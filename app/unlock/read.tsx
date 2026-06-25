import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Button } from '@/components/ui/Button';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { PageCountdown } from '@/components/ui/PageCountdown';
import { LockCountdown } from '@/components/ui/LockCountdown';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/stores/appStore';
import { getPersonalizedBooks } from '@/services/personalization';
import { getEffectiveInterests } from '@/services/coachInterests';
import { READ_REDUCE_SECONDS } from '@/constants/lock';
import { penalizeSillyAttempt } from '@/services/antiCheat';
import { useUnlockFlowGuard } from '@/hooks/useUnlockFlowGuard';
import { POINTS_PER_READ_PAGE } from '@/services/points';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';

export default function ReadUnlockScreen() {
  const router = useRouter();
  useUnlockFlowGuard();

  const reduceLockTime = useAppStore((s) => s.reduceLockTime);
  const earnReadPoints = useAppStore((s) => s.earnReadPoints);
  const lock = useAppStore((s) => s.lock);
  const lockEndsAt = useAppStore((s) => s.lockEndsAt);
  const lockMinEndsAt = useAppStore((s) => s.lockMinEndsAt);
  const userInterests = useAppStore((s) => s.userInterests);
  const coachSessions = useAppStore((s) => s.coachSessions);
  const scrollPoints = useAppStore((s) => s.scrollPoints);

  const interests = useMemo(
    () => getEffectiveInterests(userInterests, coachSessions),
    [userInterests, coachSessions]
  );
  const book = useMemo(() => getPersonalizedBooks(interests)[0], [interests]);
  const [page, setPage] = useState(0);
  const [pageReady, setPageReady] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  useEffect(() => {
    void useAppStore.getState().loadScrollPointsBalance();
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setPageReady(true);
  }, []);

  const isLast = page >= book.pages.length - 1;

  const next = () => {
    if (!pageReady) {
      penalizeSillyAttempt('Advancing before the page timer finished');
      return;
    }

    if (lock.isLocked) {
      reduceLockTime(READ_REDUCE_SECONDS);
      if (isLast) {
        router.replace(
          lock.triggeredByAppId ? `/app/${lock.triggeredByAppId}` : '/(tabs)'
        );
        return;
      }
    } else {
      void earnReadPoints(1).then(() => setConfettiKey((k) => k + 1));
      if (isLast) {
        router.replace('/(tabs)');
        return;
      }
    }

    setPageReady(false);
    setPage((p) => p + 1);
  };

  const exit = () => {
    if (lock.isLocked) penalizeSillyAttempt('Leaving read session early');
    router.back();
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1 px-4">
        <View className="flex-row justify-between mt-2 mb-2">
          <View className="flex-row items-center gap-1.5">
            <ScrollIcon name="book-open" size={14} color={colors.icon} />
            <Text className="text-scroll-muted font-display-semibold tracking-[2px] text-xs">
              READ MODE
            </Text>
          </View>
        </View>
        <ConfettiBurst fireKey={confettiKey} />
        <Text className="text-scroll-text font-display text-2xl mb-2">{book.title}</Text>

        {!lock.isLocked ? (
          <Text className="text-scroll-accent font-body-medium text-xs mb-2">
            +{POINTS_PER_READ_PAGE} {POINTS_PER_READ_PAGE === 1 ? 'pt' : 'pts'}/page · balance{' '}
            {scrollPoints}
          </Text>
        ) : null}

        {lock.isLocked ? (
          <LockCountdown lockEndsAt={lockEndsAt} lockMinEndsAt={lockMinEndsAt} compact />
        ) : null}

        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow pb-4"
          showsVerticalScrollIndicator={false}
        >
          <View className="min-h-[200px] bg-scroll-card rounded-scroll p-6 border border-scroll-border">
            <Text className="text-scroll-text font-body text-xl leading-8">{book.pages[page]}</Text>
          </View>
        </ScrollView>

        <View className="pt-2 pb-6 border-t border-white/[0.04]">
          <PageCountdown
            resetKey={`${book.id}-${page}`}
            onComplete={handleCountdownComplete}
          />
          <View className="flex-row items-center gap-4 my-2">
            <Pressable
              onPress={() => {
                if (page > 0) {
                  setPageReady(false);
                  setPage((p) => p - 1);
                }
              }}
              disabled={page === 0}
              className="p-3"
            >
              <Text className={cn('text-scroll-muted font-body-medium', page === 0 && 'opacity-30')}>
                ← Back
              </Text>
            </Pressable>
            {pageReady ? (
              <Button
                label={isLast ? (lock.isLocked ? 'Finish & return' : 'Finish') : 'Next page'}
                iconName="chevron-right"
                onPress={next}
                className="flex-1"
              />
            ) : (
              <Text className="flex-1 text-scroll-dim font-body text-sm text-center">
                Stay on this page until the timer ends
              </Text>
            )}
          </View>
          <Button variant="ghost" label="Exit" onPress={exit} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
