import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

export function AppBootOverlay() {
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center bg-scroll-bg">
      <Text className="font-display text-[32px] font-extrabold tracking-[6px] text-scroll-text">
        SCROLL
      </Text>
      <ActivityIndicator color={colors.iconActive} className="mt-4" />
    </View>
  );
}
