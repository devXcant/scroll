import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { LockCountdown } from '@/components/ui/LockCountdown';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';
import { POINTS_LOCK_REDUCE_COST } from '@/services/points';
import type { TrackedApp } from '@/types';

type Props = {
  app: TrackedApp;
  compact?: boolean;
};

export function AppLockPanel({ app, compact }: Props) {
  const router = useRouter();
  const lock = useAppStore((s) => s.lock);
  const lockEndsAt = useAppStore((s) => s.lockEndsAt);
  const lockMinEndsAt = useAppStore((s) => s.lockMinEndsAt);
  const lastPenaltyReason = useAppStore((s) => s.lastPenaltyReason);
  const scrollPoints = useAppStore((s) => s.scrollPoints);
  const spendPointsReduceLock = useAppStore((s) => s.spendPointsReduceLock);
  const onLockTimerFinished = useAppStore((s) => s.onLockTimerFinished);
  const [pointsBusy, setPointsBusy] = useState(false);

  if (!lock.isLocked || lock.triggeredByAppId !== app.id) return null;

  return (
    <GlassCard glow className={compact ? 'mb-4' : 'mb-6'}>
      <View className="mb-3 flex-row items-center gap-2">
        <ScrollIcon name="lock" size={18} color={colors.lock} />
        <Text className="font-display-semibold text-lg text-scroll-lock">{app.name} is locked</Text>
      </View>
      <Text className="mb-2 font-body leading-6 text-scroll-muted">
        {lock.message || `${app.name} hit your daily cap. SCROLL stays open so you can earn access back.`}
      </Text>

      <LockCountdown
        lockEndsAt={lockEndsAt}
        lockMinEndsAt={lockMinEndsAt}
        compact
        onTimerExpired={() => onLockTimerFinished(app.name)}
      />

      {lastPenaltyReason ? (
        <Text className="mb-2 text-center font-body text-xs text-scroll-danger">
          +2 min added: {lastPenaltyReason}
        </Text>
      ) : null}

      <Text className="mb-3 font-body-medium text-sm text-scroll-accent">Points: {scrollPoints}</Text>

      <Button iconName="book-open" label="Read to unlock" onPress={() => router.push('/unlock/read')} />
      <Button
        variant="secondary"
        iconName="layers"
        label="Learn something"
        onPress={() => router.push('/unlock/learn')}
        className="mt-3"
      />
      <Button
        variant="secondary"
        label={`Use ${POINTS_LOCK_REDUCE_COST} points (90s off)`}
        loading={pointsBusy}
        onPress={() => {
          void (async () => {
            setPointsBusy(true);
            const result = await spendPointsReduceLock();
            if (!result.ok) {
              Alert.alert('Not enough points', result.reason ?? 'Try reading first.');
            }
            setPointsBusy(false);
          })();
        }}
        className="mt-3"
      />
      <Button
        variant="amber"
        iconName="credit-card"
        label="Pay to unlock"
        onPress={() => router.push('/unlock/pay')}
        className="mt-3"
      />
    </GlassCard>
  );
}
