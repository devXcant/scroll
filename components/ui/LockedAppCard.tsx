import { Pressable, Text, View } from 'react-native';
import type { TrackedApp, UsageSnapshot } from '@/types';
import { cn } from '@/lib/cn';

type Props = {
  app: TrackedApp;
  usage?: UsageSnapshot;
  sessionLocked?: boolean;
  onPress?: () => void;
};

export function LockedAppCard({ app, usage, sessionLocked, onPress }: Props) {
  const used = usage?.minutesUsed ?? 0;
  const limit = app.dailyLimitMinutes;

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'mr-3 w-[148px] rounded-scroll border border-scroll-border bg-scroll-surface p-3 active:opacity-90',
        sessionLocked && 'border-scroll-lock bg-scroll-lock/10',
      )}>
      <View
        className={cn(
          'mb-2.5 h-10 w-10 items-center justify-center rounded-scroll-sm border border-scroll-border bg-scroll-card',
          sessionLocked && 'border-scroll-lock',
        )}>
        <Text className="font-extrabold text-scroll-text">{app.name.charAt(0)}</Text>
      </View>
      <Text className="font-display-semibold text-sm text-scroll-text" numberOfLines={1}>
        {app.name}
      </Text>
      <Text className="mt-1 font-body text-xs text-scroll-muted">
        {used}m / {limit}m
      </Text>
      {sessionLocked ? (
        <Text className="mt-2 text-[10px] font-extrabold tracking-wider text-scroll-lock">
          LOCKED
        </Text>
      ) : (
        <Text className="mt-2 text-[10px] font-extrabold tracking-wider text-scroll-dim">
          AT LIMIT
        </Text>
      )}
    </Pressable>
  );
}
