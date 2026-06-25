import { useCallback, useMemo, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { PageCountdown } from '@/components/ui/PageCountdown';
import { LockCountdown } from '@/components/ui/LockCountdown';
import { useAppStore } from '@/stores/appStore';
import { getPersonalizedModules } from '@/services/personalization';
import { getEffectiveInterests, getOnboardingCoachSummary } from '@/services/coachInterests';
import { LEARN_REDUCE_SECONDS } from '@/constants/lock';
import { penalizeSillyAttempt } from '@/services/antiCheat';
import type { LearnModule } from '@/types';
import { useUnlockFlowGuard } from '@/hooks/useUnlockFlowGuard';

export default function LearnUnlockScreen() {
  const router = useRouter();
  useUnlockFlowGuard();
  const reduceLockTime = useAppStore((s) => s.reduceLockTime);
  const lock = useAppStore((s) => s.lock);
  const lockEndsAt = useAppStore((s) => s.lockEndsAt);
  const lockMinEndsAt = useAppStore((s) => s.lockMinEndsAt);
  const userInterests = useAppStore((s) => s.userInterests);
  const coachSessions = useAppStore((s) => s.coachSessions);

  const effectiveInterests = useMemo(
    () => getEffectiveInterests(userInterests, coachSessions),
    [userInterests, coachSessions]
  );
  const coachSummary = useMemo(() => getOnboardingCoachSummary(coachSessions), [coachSessions]);
  const modules = useMemo(
    () => getPersonalizedModules(effectiveInterests),
    [effectiveInterests]
  );
  const [module, setModule] = useState<LearnModule | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideReady, setSlideReady] = useState(false);

  const handleCountdownComplete = useCallback(() => {
    setSlideReady(true);
  }, []);

  if (!module) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1 p-6">
          <Text className="text-scroll-text font-display text-[32px]">Pick a lesson</Text>
          <Text className="text-scroll-muted font-body mb-2">
            Matched to your onboarding + coach inputs.
          </Text>
          {coachSummary ? (
            <Text className="text-scroll-dim font-body mb-4">Coach heard: {coachSummary}</Text>
          ) : null}
          <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
            {modules.map((m) => (
              <GlassCard key={m.id} className="mb-4">
                <Text className="text-scroll-muted text-[10px] tracking-[2px] font-display-semibold">
                  {m.topic.toUpperCase()}
                </Text>
                <Text className="text-scroll-text font-display-semibold text-lg mt-1">
                  {m.title}
                </Text>
                <Text className="text-scroll-dim font-body mt-1">{m.durationMinutes} min</Text>
                <Button
                  label="Start"
                  variant="secondary"
                  iconName="play"
                  onPress={() => {
                    setModule(m);
                    setSlideIndex(0);
                    setSlideReady(false);
                  }}
                  className="mt-3"
                />
              </GlassCard>
            ))}
          </ScrollView>
          <Button variant="ghost" label="Back" onPress={() => router.back()} />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const slide = module.slides[slideIndex];
  const isLast = slideIndex >= module.slides.length - 1;

  const next = () => {
    if (!slideReady) {
      penalizeSillyAttempt('Advancing before the lesson timer finished');
      return;
    }
    if (isLast) {
      if (lock.isLocked) {
        reduceLockTime(LEARN_REDUCE_SECONDS);
        router.replace(
          lock.triggeredByAppId ? `/app/${lock.triggeredByAppId}` : '/(tabs)'
        );
      } else {
        router.replace('/(tabs)');
      }
      return;
    }
    if (lock.isLocked) reduceLockTime(LEARN_REDUCE_SECONDS);
    setSlideReady(false);
    setSlideIndex((i) => i + 1);
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1 p-6">
        <Text className="text-scroll-muted font-display-semibold tracking-[2px] text-xs">
          {module.topic}
        </Text>
        <Text className="text-scroll-text font-display text-2xl my-4">{slide.title}</Text>

        {lock.isLocked ? (
          <LockCountdown lockEndsAt={lockEndsAt} lockMinEndsAt={lockMinEndsAt} compact />
        ) : null}

        <GlassCard className="flex-1 mb-4">
          <Text className="text-scroll-text font-body text-base leading-[26px]">{slide.body}</Text>
          {slide.fact ? (
            <Text className="text-scroll-muted font-body mt-6 leading-[22px] italic">
              {slide.fact}
            </Text>
          ) : null}
        </GlassCard>
        <Text className="text-scroll-dim text-center mb-2 font-body">
          {slideIndex + 1} / {module.slides.length}
        </Text>

        <PageCountdown
          resetKey={`${module.id}-${slideIndex}`}
          onComplete={handleCountdownComplete}
        />

        {slideReady ? (
          <Button
            label={isLast ? 'Complete & return' : 'Next'}
            iconName="chevron-right"
            onPress={next}
          />
        ) : null}
        {module.youtubeUrl ? (
          <Button
            variant="secondary"
            iconName="video"
            label={module.youtubeLabel ?? 'Watch related YouTube'}
            onPress={() => void Linking.openURL(module.youtubeUrl!)}
            className="mt-2"
          />
        ) : null}
        <Button
          variant="ghost"
          label="Choose another"
          onPress={() => {
            if (lock.isLocked) penalizeSillyAttempt('Switching lessons mid-session');
            setModule(null);
          }}
          className="mt-2"
        />
      </SafeAreaView>
    </GradientBackground>
  );
}
