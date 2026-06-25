import Svg, { Circle } from 'react-native-svg';
import { Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/cn';

type Props = {
  progress: number;
  size?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  className?: string;
};

export function ProgressRing({
  progress,
  size = 120,
  label,
  sublabel,
  color = colors.accent,
  className,
}: Props) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clamped);

  return (
    <View className={cn('items-center justify-center', className, `h-[${size}px] w-[${size}px]`)}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surface}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        {label ? (
          <Text className="text-lg font-extrabold text-scroll-text">{label}</Text>
        ) : null}
        {sublabel ? (
          <Text className="mt-0.5 font-body text-xs text-scroll-muted">{sublabel}</Text>
        ) : null}
      </View>
    </View>
  );
}
