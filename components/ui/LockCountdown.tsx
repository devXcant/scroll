import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { formatCountdown, secondsUntil } from '@/services/lockTimer';
import { useTick } from '@/hooks/useTick';
import { MIN_LOCK_REMAINING_SECONDS } from '@/constants/lock';
import { cn } from '@/lib/cn';

type Props = {
  lockEndsAt: string | null;
  lockMinEndsAt: string | null;
  compact?: boolean;
  onTimerExpired?: () => void;
};

export function LockCountdown({
  lockEndsAt,
  lockMinEndsAt,
  compact,
  onTimerExpired,
}: Props) {
  useTick(Boolean(lockEndsAt));
  const remaining = secondsUntil(lockEndsAt);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [lockEndsAt]);

  useEffect(() => {
    if (!lockEndsAt || remaining > 0 || !onTimerExpired || firedRef.current) return;
    firedRef.current = true;
    onTimerExpired();
  }, [lockEndsAt, remaining, onTimerExpired]);

  const atFloor =
    lockEndsAt &&
    lockMinEndsAt &&
    secondsUntil(lockEndsAt) <= MIN_LOCK_REMAINING_SECONDS + 2;

  if (!lockEndsAt || remaining <= 0) {
    return (
      <Text
        className={cn(
          'mt-2 text-center font-body text-xs text-scroll-dim',
          compact && 'text-xs',
        )}
      >
        {onTimerExpired
          ? 'Timer done. Read, learn, spend points, or pay to unlock.'
          : 'Complete read or learn to earn access'}
      </Text>
    );
  }

  return (
    <View
      className={cn(
        'my-4 w-full items-center rounded-scroll-md border border-scroll-border bg-scroll-surface p-6',
        compact && 'my-2 p-4',
      )}
    >
      <Text
        className={cn(
          'font-body text-sm uppercase tracking-wide text-scroll-muted',
          compact && 'text-xs',
        )}
      >
        Unlocks in
      </Text>
      <Text className={cn('mt-2 font-display text-scroll-lock', compact ? 'text-[32px]' : 'text-[44px]')}>
        {formatCountdown(remaining)}
      </Text>
      {atFloor ? (
        <Text className="mt-2.5 text-center font-body text-xs leading-[18px] text-scroll-dim">
          Minimum lock reached. Reading still helps, but won&apos;t drop below{' '}
          {Math.floor(MIN_LOCK_REMAINING_SECONDS / 60)} min
        </Text>
      ) : (
        <Text className="mt-2 text-center font-body text-xs text-scroll-dim">
          Read or learn to shave time off (not below minimum)
        </Text>
      )}
    </View>
  );
}
