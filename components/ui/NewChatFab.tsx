import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors, spacing } from '@/constants/theme';

type Props = {
  onPress: () => void;
  bottomOffset?: number;
};

/** Floating new-chat — bottom-right, above tab bar */
export function NewChatFab({ onPress, bottomOffset = 88 }: Props) {
  const bottomPx = bottomOffset + spacing.md;

  return (
    <View
      pointerEvents="box-none"
      className="absolute right-5 z-[100]"
      style={{ bottom: bottomPx }}>
      <Pressable
        className="h-14 w-14 items-center justify-center rounded-full border border-scroll-border-glow bg-scroll-surface-hover shadow-lg shadow-black/40 active:opacity-90"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        accessibilityLabel="New chat">
        <ScrollIcon name="plus" size={26} color={colors.text} />
      </Pressable>
    </View>
  );
}
