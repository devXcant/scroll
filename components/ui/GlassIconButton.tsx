import { Pressable, StyleSheet } from 'react-native';
import { ScrollIcon, type ScrollIconName } from '@/components/ui/ScrollIcon';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { colors } from '@/constants/theme';

type Props = {
  icon: ScrollIconName;
  onPress: () => void;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  glow?: boolean;
};

export function GlassIconButton({
  icon,
  onPress,
  size = 20,
  color = colors.text,
  accessibilityLabel,
  glow,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}>
      <GlassSurface glow={glow} interactive style={styles.shell}>
        <ScrollIcon name={icon} size={size} color={color} />
      </GlassSurface>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
