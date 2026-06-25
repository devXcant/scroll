import {
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '@/constants/theme';
import { ScrollIcon, type ScrollIconName } from '@/components/ui/ScrollIcon';
import { cn } from '@/lib/cn';

type Props = PressableProps & {
  iconName: ScrollIconName;
  title: string;
  subtitle: string;
  wide?: boolean;
  className?: string;
};

export function UnlockTile({ iconName, title, subtitle, wide, style, className, ...rest }: Props) {
  return (
    <Pressable
      className={cn(
        'w-[47%] rounded-scroll border border-scroll-border bg-scroll-card p-4',
        wide && 'w-full border-scroll-border-glow',
        className,
      )}
      style={({ pressed }) => [
        pressed ? { opacity: 0.9 } : undefined,
        style as StyleProp<ViewStyle>,
      ]}
      {...rest}
    >
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-scroll-sm border border-scroll-border bg-scroll-surface">
        <ScrollIcon name={iconName} size={20} color={colors.accent} />
      </View>
      <Text className="font-display-semibold text-base text-scroll-text">{title}</Text>
      <Text className="mt-1 font-body text-xs text-scroll-muted">{subtitle}</Text>
    </Pressable>
  );
}
