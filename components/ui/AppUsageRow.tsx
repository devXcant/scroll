import { Pressable, Text, View } from 'react-native';
import type { TrackedApp, UsageSnapshot } from '@/types';
import { cn } from '@/lib/cn';

type Props = {
  app: TrackedApp;
  usage?: UsageSnapshot;
  inGrace?: boolean;
  sessionLocked?: boolean;
  onPress?: () => void;
};

export function AppUsageRow({ app, usage, inGrace, sessionLocked, onPress }: Props) {
  const used = usage?.minutesUsed ?? 0;
  const limit = app.dailyLimitMinutes;
  const remaining = Math.max(0, limit - used);
  const pct = Math.min(1, used / limit);
  const over = used >= limit;
  const showLocked = over && sessionLocked && !inGrace;
  const showGrace = over && inGrace;

  const content = (
    <>
      <View
        className={cn(
          'h-11 w-11 items-center justify-center rounded-scroll-sm border border-white/20 bg-white/10',
          showLocked && 'border-scroll-lock bg-scroll-lock/10',
          showGrace && 'border-scroll-accent bg-scroll-success/10',
        )}
      >
        <Text className="text-base font-extrabold text-scroll-text">{app.name.charAt(0)}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-scroll-text">{app.name}</Text>
        <Text className="mt-0.5 font-body text-xs text-scroll-muted">
          {used}m used ·{' '}
          {showGrace ? 'open now' : over ? 'limit reached' : `${remaining}m left`} (cap {limit}m)
        </Text>
        <View className="mt-2 h-1 overflow-hidden rounded-sm bg-white/10">
          <View
            className={cn(
              'h-full rounded-sm bg-scroll-dim',
              showLocked && 'bg-scroll-lock',
              showGrace && 'bg-scroll-accent',
              `w-[${Math.round(pct * 100)}%]`
            )}
          />
        </View>
      </View>
      {showLocked ? (
        <Text className="text-[10px] font-extrabold tracking-wider text-scroll-lock">LOCKED</Text>
      ) : null}
      {showGrace ? (
        <Text className="text-[10px] font-extrabold tracking-wider text-scroll-accent">OPEN</Text>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="flex-row items-center gap-3.5 py-3 active:opacity-90">
        {content}
      </Pressable>
    );
  }

  return <View className="flex-row items-center gap-3.5 py-3">{content}</View>;
}
