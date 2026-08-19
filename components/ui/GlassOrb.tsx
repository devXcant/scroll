import { useId } from 'react';
import { MotiView } from 'moti';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  size?: number;
};

export function GlassOrb({ size = 240 }: Props) {
  const rawId = useId().replace(/:/g, '');
  const core = `orbCore${rawId}`;
  const rim = `orbRim${rawId}`;

  return (
    <MotiView
      from={{ translateY: 0, scale: 1 }}
      animate={{ translateY: -14, scale: 1.04 }}
      transition={{ type: 'timing', duration: 5200, loop: true, repeatReverse: true }}>
      <Svg width={size} height={size} viewBox="0 0 240 240">
        <Defs>
          <RadialGradient id={core} cx="36%" cy="30%" r="68%">
            <Stop offset="0" stopColor="#FFD0A8" stopOpacity="0.95" />
            <Stop offset="0.38" stopColor="#D95D1A" stopOpacity="0.72" />
            <Stop offset="1" stopColor="#1A0703" stopOpacity="0.08" />
          </RadialGradient>
          <RadialGradient id={rim} cx="50%" cy="50%" r="50%">
            <Stop offset="0.72" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.22" />
          </RadialGradient>
        </Defs>
        <Circle cx="120" cy="120" r="102" fill={`url(#${core})`} />
        <Circle cx="120" cy="120" r="102" fill={`url(#${rim})`} />
        <Ellipse cx="86" cy="78" rx="42" ry="24" fill="#FFFFFF" opacity="0.28" />
        <Ellipse cx="154" cy="156" rx="36" ry="16" fill="#000000" opacity="0.18" />
      </Svg>
    </MotiView>
  );
}
