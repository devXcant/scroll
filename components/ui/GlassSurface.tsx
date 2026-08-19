import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { getGlassModule } from '@/lib/glass';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  glow?: boolean;
  interactive?: boolean;
};

export function GlassSurface({ children, style, intensity = 54, glow, interactive }: Props) {
  const { available, mod } = getGlassModule();
  const borderColor = glow ? 'rgba(217,93,26,0.52)' : 'rgba(255,255,255,0.18)';
  const fill = glow ? 'rgba(217,93,26,0.10)' : 'rgba(255,255,255,0.06)';

  const chrome = (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.sheen}
      />
      {children}
    </>
  );

  if (available && mod) {
    return (
      <mod.GlassView
        glassEffectStyle="regular"
        isInteractive={Boolean(interactive)}
        colorScheme="dark"
        style={[{ overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor }, style]}>
        {chrome}
      </mod.GlassView>
    );
  }

  return (
    <View
      style={[
        {
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor,
          backgroundColor: fill,
        },
        style,
      ]}>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      {chrome}
    </View>
  );
}

const styles = StyleSheet.create({
  sheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 46,
  },
});
