import { Pressable, StyleSheet, View } from 'react-native';
import { ScrollIcon, type ScrollIconName } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';

type Props = {
  icon: ScrollIconName;
  onPress: () => void;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
};

export function GlassIconButton({
  icon,
  onPress,
  size = 20,
  color = colors.text,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}>
      <View style={styles.shell}>
        <ScrollIcon name={icon} size={size} color={color} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
  shell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
