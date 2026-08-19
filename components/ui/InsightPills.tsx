import { Text, View } from 'react-native';
import { MotiView } from 'moti';
import { GlassSurface } from '@/components/ui/GlassSurface';

type Item = {
  label: string;
  value: string;
};

type Props = {
  items: Item[];
};

export function InsightPills({ items }: Props) {
  return (
    <View className="mt-4 flex-row gap-2">
      {items.map((item, index) => (
        <MotiView
          key={item.label}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 380, delay: index * 70 }}
          style={{ flex: 1 }}>
          <GlassSurface style={{ borderRadius: 18, paddingHorizontal: 12, paddingVertical: 12 }}>
            <Text className="font-display-semibold text-lg text-scroll-text">{item.value}</Text>
            <Text className="mt-0.5 font-body text-[11px] text-scroll-muted">{item.label}</Text>
          </GlassSurface>
        </MotiView>
      ))}
    </View>
  );
}
