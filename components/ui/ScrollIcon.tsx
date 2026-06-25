import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

export type ScrollIconName = keyof typeof Feather.glyphMap;

type Props = {
  name: ScrollIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function ScrollIcon({
  name,
  size = 22,
  color = colors.textMuted,
  strokeWidth = 1.75,
}: Props) {
  return <Feather name={name} size={size} color={color} strokeWidth={strokeWidth} />;
}
