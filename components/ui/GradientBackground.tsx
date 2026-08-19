import { StyleSheet, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { GlassOrb } from '@/components/ui/GlassOrb';
import { cn } from '@/lib/cn';

type Props = ViewProps & {
  variant?: 'default' | 'lock' | 'success';
  className?: string;
};

const variants = {
  default: ['#1A0C06', '#000000'] as const,
  lock: ['#2A0E06', '#000000'] as const,
  success: ['#04140C', '#000000'] as const,
};

export function GradientBackground({
  variant = 'default',
  className,
  children,
  ...rest
}: Props) {
  return (
    <View className={cn('flex-1 overflow-hidden bg-black', className)} {...rest}>
      <LinearGradient
        colors={[...variants[variant]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />
      <MotiView
        pointerEvents="none"
        from={{ opacity: 0.28, translateX: 0, translateY: 0 }}
        animate={{ opacity: 0.5, translateX: 16, translateY: 22 }}
        transition={{ type: 'timing', duration: 9000, loop: true, repeatReverse: true }}
        style={styles.glowA}
      />
      <MotiView
        pointerEvents="none"
        from={{ opacity: 0.12, translateY: 0 }}
        animate={{ opacity: 0.22, translateY: -18 }}
        transition={{ type: 'timing', duration: 11000, loop: true, repeatReverse: true }}
        style={styles.glowB}
      />
      <View pointerEvents="none" style={styles.orbWrap}>
        <GlassOrb size={268} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glowA: {
    position: 'absolute',
    top: -110,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(217,93,26,0.38)',
  },
  glowB: {
    position: 'absolute',
    bottom: 80,
    left: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(76,141,255,0.16)',
  },
  orbWrap: {
    position: 'absolute',
    top: -36,
    right: -64,
    opacity: 0.42,
  },
});
