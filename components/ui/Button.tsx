import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import { ScrollIcon, type ScrollIconName } from '@/components/ui/ScrollIcon';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  iconName?: ScrollIconName;
  className?: string;
};

const variantClassName: Record<Exclude<Variant, 'primary'>, string> = {
  secondary:
    'min-h-[52px] w-full items-center justify-center overflow-hidden rounded-scroll-md border border-scroll-border bg-scroll-surface px-6 active:opacity-90 disabled:opacity-40',
  ghost:
    'min-h-[52px] w-full items-center justify-center overflow-hidden rounded-scroll-md bg-transparent px-4 active:opacity-90 disabled:opacity-40',
  danger:
    'min-h-[52px] w-full items-center justify-center overflow-hidden rounded-scroll-md border border-scroll-danger/40 bg-scroll-danger/15 px-6 active:opacity-90 disabled:opacity-40',
  amber:
    'min-h-[52px] w-full items-center justify-center overflow-hidden rounded-scroll-md border border-scroll-border-glow bg-scroll-accent-soft px-6 active:opacity-90 disabled:opacity-40',
};

const variantTextClassName: Record<Exclude<Variant, 'primary'>, string> = {
  secondary: 'font-body-medium text-scroll-text',
  ghost: 'font-body-medium text-scroll-muted',
  danger: 'font-body-medium text-scroll-danger',
  amber: 'font-body-medium text-scroll-lock',
};

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  iconName,
  onPress,
  className,
  ...rest
}: Props) {
  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    if (!disabled && !loading) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  const iconColor =
    variant === 'primary'
      ? colors.text
      : variant === 'amber'
        ? colors.lock
        : variant === 'danger'
          ? colors.danger
          : colors.text;

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        className={cn(
          'w-full overflow-hidden rounded-scroll-md active:opacity-90 disabled:opacity-40',
          className
        )}
        {...rest}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="min-h-[52px] w-full items-center justify-center px-6"
        >
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <View className="flex-row items-center gap-2.5">
              {iconName ? <ScrollIcon name={iconName} size={18} color={iconColor} /> : null}
              <Text className="font-body text-base font-bold tracking-wide text-scroll-text">
                {label}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      className={cn(variantClassName[variant], className)}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <View className="flex-row items-center gap-2.5">
          {iconName ? <ScrollIcon name={iconName} size={18} color={iconColor} /> : null}
          <Text className={cn('text-base', variantTextClassName[variant])}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
