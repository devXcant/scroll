import { Text, View } from 'react-native';
import { cn } from '@/lib/cn';

type Props = {
  values: number[];
  labels: string[];
  maxMinutes: number;
  barClassName?: string;
  highlightLast?: boolean;
};

export function UsageBarChart({
  values,
  labels,
  maxMinutes,
  barClassName = 'bg-scroll-accent',
  highlightLast = false,
}: Props) {
  const max = Math.max(maxMinutes, 1, ...values);

  return (
    <View className="flex-row items-end justify-between gap-1.5 pt-2">
      {values.map((v, i) => {
        const h = Math.max(4, (v / max) * 72);
        const isLast = highlightLast && i === values.length - 1;
        return (
          <View key={`${labels[i] ?? i}-${i}`} className="flex-1 items-center">
            <Text className="mb-1 min-h-3 font-body text-[9px] text-scroll-dim">
              {v > 0 ? `${v}m` : ''}
            </Text>
            <View className="h-[72px] w-full items-center justify-end">
              <View
                className={cn(
                  'w-[70%] min-w-2 rounded',
                  isLast ? 'bg-scroll-accent' : barClassName
                )}
                style={{ height: h }}
              />
            </View>
            <Text
              className={cn(
                'mt-1.5 text-center font-body text-[9px]',
                isLast ? 'font-body-medium text-scroll-accent' : 'text-scroll-dim'
              )}
              numberOfLines={1}>
              {labels[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
