import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { colors, spacing } from '@/constants/theme';

type Props = {
  onPress: () => void;
  bottomOffset?: number;
};

export function NewChatFab({ onPress, bottomOffset = 88 }: Props) {
  const bottomPx = bottomOffset + spacing.md;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomPx }]}>
      <MotiView
        from={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 180 }}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
          }}
          accessibilityLabel="New chat"
          style={({ pressed }) => [pressed && styles.pressed]}>
          <GlassSurface glow interactive style={styles.fab}>
            <ScrollIcon name="plus" size={26} color={colors.text} />
          </GlassSurface>
        </Pressable>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
});
