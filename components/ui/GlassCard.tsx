import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { cn } from '@/lib/cn';

type Props = ViewProps & {
  glow?: boolean;
  className?: string;
};

export function GlassCard({ className, children, glow, style, ...rest }: Props) {
  return (
    <View
      className={cn('overflow-hidden rounded-[22px]', className)}
      style={style}
      {...rest}>
      <GlassSurface glow={glow} style={[StyleSheet.absoluteFillObject, styles.radius]} />
      <View className="p-5">{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  radius: {
    borderRadius: 22,
  },
});
