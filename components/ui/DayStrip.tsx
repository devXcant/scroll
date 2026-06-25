import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { formatDayLabel } from '@/services/usageHistory';
import { cn } from '@/lib/cn';

type Props = {
  days: string[];
  selected: string;
  onSelect: (day: string) => void;
};

export function DayStrip({ days, selected, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    });
  }, [days.length]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 py-2 pr-2">
      {days.map((day) => {
        const active = day === selected;
        return (
          <Pressable
            key={day}
            onPress={() => onSelect(day)}
            className={cn(
              'rounded-full border px-3.5 py-2.5',
              active
                ? 'border-scroll-accent bg-scroll-accent/15'
                : 'border-scroll-border bg-scroll-surface'
            )}>
            <Text
              className={cn(
                'font-body-medium text-xs',
                active ? 'text-scroll-accent' : 'text-scroll-muted'
              )}>
              {formatDayLabel(day)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
