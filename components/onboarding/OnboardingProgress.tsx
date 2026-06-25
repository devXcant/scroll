import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { cn } from '@/lib/cn';

type Props = {
  step: number;
  total: number;
  className?: string;
};

export function OnboardingProgress({ step, total, className }: Props) {
  return (
    <View className={cn('gap-2', className)}>
      <Text className="font-body-medium text-xs text-scroll-dim">
        Step {step} of {total}
      </Text>
      <View className="h-1 flex-row overflow-hidden rounded-full bg-scroll-surface">
        {Array.from({ length: total }).map((_, i) => (
          <MotiView
            key={i}
            animate={{
              opacity: i < step ? 1 : 0.25,
              scaleX: i < step ? 1 : 0.85,
            }}
            transition={{ type: 'timing', duration: 350 }}
            className={cn(
              'h-full flex-1',
              i < total - 1 && 'mr-0.5',
              i < step ? 'bg-scroll-accent' : 'bg-scroll-border'
            )}
          />
        ))}
      </View>
    </View>
  );
}
