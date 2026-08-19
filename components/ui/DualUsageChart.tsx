import { Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/cn';

export type UsageDayPoint = {
  label: string;
  used: number;
  limit: number;
  locked?: boolean;
};

type Props = {
  days: UsageDayPoint[];
  highlightLast?: boolean;
  usedLabel?: string;
  limitLabel?: string;
};

export function DualUsageChart({
  days,
  highlightLast = true,
  usedLabel = 'Minutes used',
  limitLabel = 'Daily cap',
}: Props) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.used, d.limit)));

  return (
    <View>
      <View className="mb-3 flex-row flex-wrap gap-x-4 gap-y-1">
        <LegendDot color="#4C8DFF" label={usedLabel} />
        <LegendDot color="rgba(255,255,255,0.18)" label={limitLabel} />
        {days.some((d) => d.locked) ? (
          <LegendDot color={colors.accent} label="Locked that day" />
        ) : null}
      </View>
      <View className="flex-row items-end justify-between gap-1.5">
        {days.map((day, i) => {
          const isLast = highlightLast && i === days.length - 1;
          const trackH = Math.max(6, (day.limit / max) * 88);
          const usedCap = Math.min(day.used, Math.max(day.limit, 1));
          const usedH = Math.max(day.used > 0 ? 6 : 0, (usedCap / max) * 88);
          const over = Math.max(0, day.used - day.limit);
          const overH = over > 0 ? Math.max(4, (over / max) * 88) : 0;
          return (
            <View key={`${day.label}-${i}`} className="flex-1 items-center">
              <Text className="mb-1 min-h-3 font-body text-[9px] text-scroll-dim">
                {day.used > 0 ? `${day.used}m` : ''}
              </Text>
              <View className="h-[88px] w-full items-center justify-end">
                <View className="w-[72%] min-w-2 items-center justify-end" style={{ height: 88 }}>
                  <View
                    className="absolute bottom-0 w-full rounded-md"
                    style={{ height: trackH, backgroundColor: 'rgba(255,255,255,0.10)' }}
                  />
                  {usedH > 0 ? (
                    <View
                      className="absolute bottom-0 w-full rounded-md"
                      style={{ height: usedH, backgroundColor: isLast ? '#5B9BFF' : '#4C8DFF' }}
                    />
                  ) : null}
                  {overH > 0 ? (
                    <View
                      className="absolute w-full rounded-t-md"
                      style={{
                        height: overH,
                        bottom: usedH,
                        backgroundColor: colors.accent,
                      }}
                    />
                  ) : null}
                </View>
              </View>
              {day.locked ? (
                <View className="mt-1 h-1.5 w-1.5 rounded-full bg-scroll-accent" />
              ) : (
                <View className="mt-1 h-1.5" />
              )}
              <Text
                className={cn(
                  'mt-1 text-center font-body text-[9px]',
                  isLast ? 'font-body-medium text-scroll-text' : 'text-scroll-dim'
                )}
                numberOfLines={1}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="font-body text-[10px] text-scroll-muted">{label}</Text>
    </View>
  );
}
