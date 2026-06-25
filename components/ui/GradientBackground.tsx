import { View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/cn';

type Props = ViewProps & {
  variant?: 'default' | 'lock' | 'success';
  className?: string;
};

const variants = {
  default: ['#000000', '#000000'] as const,
  lock: ['#1A0A00', '#000000'] as const,
  success: ['#000000', '#000000'] as const,
};

export function GradientBackground({
  variant = 'default',
  className,
  children,
  ...rest
}: Props) {
  return (
    <View className={cn('flex-1 overflow-hidden bg-scroll-bg', className)} {...rest}>
      <LinearGradient
        colors={[...variants[variant]]}
        className="absolute inset-0"
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {children}
    </View>
  );
}
