import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

type Props = ViewProps & {
  glow?: boolean;
  className?: string;
};

export function GlassCard({ className, children, glow, style, ...rest }: Props) {
  return (
    <View
      className={cn(
        'overflow-hidden rounded-[20px] border border-scroll-border bg-scroll-bg',
        glow ? 'shadow-lg shadow-scroll-accent/20' : '',
        className
      )}
      style={style}
      {...rest}>
      <View className="p-5">{children}</View>
    </View>
  );
}
