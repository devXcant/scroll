import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { GlassIconButton } from '@/components/ui/GlassIconButton';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  className?: string;
};

export function GlassHeader({ title, subtitle, onBack, right, className }: Props) {
  return (
    <View className={`px-4 pb-3 pt-1 ${className ?? ''}`}>
      <View className="flex-row items-center gap-3">
        {onBack ? (
          <GlassIconButton icon="chevron-left" onPress={onBack} accessibilityLabel="Go back" />
        ) : (
          <View className="w-11" />
        )}
        <View className="min-w-0 flex-1">
          <Text className="font-display text-xl text-scroll-text" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 font-body text-xs text-scroll-muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ?? <View className="w-11" />}
      </View>
    </View>
  );
}
