import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Button } from '@/components/ui/Button';
import { PageCountdown } from '@/components/ui/PageCountdown';
import { LockCountdown } from '@/components/ui/LockCountdown';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/stores/appStore';
import { getPersonalizedBooks } from '@/services/personalization';
import { getEffectiveInterests } from '@/services/coachInterests';
import { READ_REDUCE_SECONDS, READ_UNLOCK_MINUTES } from '@/constants/lock';
import { penalizeSillyAttempt } from '@/services/antiCheat';
import { useUnlockFlowGuard } from '@/hooks/useUnlockFlowGuard';
import { POINTS_PER_READ_PAGE } from '@/services/points';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';

export default function ReadUnlockScreen() {
  const router = useRouter();
  useUnlockFlowGuard();
  const scrollRef = useRef<ScrollView>(null);

  const reduceLockTime = useAppStore((s) => s.reduceLockTime);
  const earnReadPoints = useAppStore((s) => s.earnReadPoints);
  const unlock = useAppStore((s) => s.unlock);
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
  const advancing = useRef(false);

  useEffect(() => {
    void useAppStore.getState().loadScrollPointsBalance();
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setPageReady(true);
  }, []);

  const isLast = page >= book.pages.length - 1;

  const next = () => {
    if (!pageReady || advancing.current) {
      if (!pageReady) penalizeSillyAttempt('Advancing before the page timer finished');
      return;
    }
    advancing.current = true;
    setConfettiKey((k) => k + 1);
    void earnReadPoints(1);
    if (lock.isLocked) {
      reduceLockTime(READ_REDUCE_SECONDS);
    }
    setTimeout(() => {
      if (isLast) {
        if (lock.isLocked) {
          unlock('read', READ_UNLOCK_MINUTES, lock.triggeredByAppId ?? undefined);
        }
        router.replace('/(tabs)');
        return;
      }
      setPageReady(false);
      setPage((p) => p + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      advancing.current = false;
    }, 280);
  };

  const exit = () => {
    if (!lock.isLocked) {
      router.back();
      return;
    }
    Alert.alert(
      'Leave this session?',
      'If you leave now, this app stays locked longer. Stay and finish a few pages to earn time back.',
      [
        { text: 'Keep reading', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            penalizeSillyAttempt('Leaving read session early');
            router.back();
          },
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1 px-4">
        <ConfettiBurst fireKey={confettiKey} />
        <Text className="text-scroll-text font-display text-2xl mt-2 mb-2">{book.title}</Text>

        <Text className="text-scroll-accent font-body-medium text-xs mb-2">
          +{POINTS_PER_READ_PAGE} {POINTS_PER_READ_PAGE === 1 ? 'pt' : 'pts'}/page · {scrollPoints} total
        </Text>

        {lock.isLocked ? (
          <LockCountdown lockEndsAt={lockEndsAt} lockMinEndsAt={lockMinEndsAt} compact />
        ) : null}

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="flex-grow pb-4"
          showsVerticalScrollIndicator={false}
        >
          <View className="min-h-[200px] overflow-hidden rounded-scroll">
            <GlassSurface style={{ borderRadius: 24, padding: 24, minHeight: 200 }}>
              <Text className="text-scroll-text font-body text-xl leading-8">{book.pages[page]}</Text>
            </GlassSurface>
          </View>
        </ScrollView>

        <View className="pt-2 pb-6 border-t border-white/[0.04]">
          <PageCountdown
            resetKey={`${book.id}-${page}`}
            onComplete={handleCountdownComplete}
          />
          <View className="flex-row items-center gap-4 my-2">
            <Pressable
              onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
              className="p-3"
            >
              <Text className={cn('text-scroll-muted font-body-medium')}>← Back</Text>
            </Pressable>
            {pageReady ? (
              <Button
                label={isLast ? (lock.isLocked ? 'Finish & unlock' : 'Finish') : 'Next page'}
                iconName="chevron-right"
                onPress={next}
                className="flex-1"
              />
            ) : (
              <View className="flex-1" />
            )}
          </View>
          <Button variant="ghost" label="Exit" onPress={exit} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
