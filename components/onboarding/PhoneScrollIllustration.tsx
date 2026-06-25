import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { MotiView } from 'moti';
import { colors } from '@/constants/theme';

const FEED_ROW_COUNT = 5;

export function PhoneScrollIllustration() {
  return (
    <View className="h-[260px] w-[260px] items-center justify-center">
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        className="items-center">
        <Svg width={220} height={220} viewBox="0 0 220 220">
          {/* <Circle cx="110" cy="118" r="72" fill="rgba(255,102,0,0.08)" /> */}
          <Path
            d="M72 176c8-34 28-52 38-52s30 18 38 52"
            fill="rgba(255,255,255,0.08)"
          />
          <Circle cx="110" cy="78" r="28" fill="rgba(255,255,255,0.12)" />
          <Path
            d="M78 118c6-8 16-12 32-12s26 4 32 12"
            fill="rgba(255,255,255,0.1)"
          />
        </Svg>

        <MotiView
          from={{ translateY: 8 }}
          animate={{ translateY: [8, 0, 8] }}
          transition={{ type: 'timing', duration: 2400, loop: true }}
          className="absolute top-[34px]">
          <View className="h-[148px] w-[88px] overflow-hidden rounded-[18px] border-[3px] border-white/20 bg-black">
            <View className="mx-auto mt-2 h-1.5 w-8 rounded-full bg-white/20" />
            <View className="mt-3 px-2">
              {Array.from({ length: FEED_ROW_COUNT }).map((_, index) => (
                <MotiView
                  key={index}
                  from={{ translateY: 0, opacity: 0.35 }}
                  animate={{ translateY: [-18, -72], opacity: [0.35, 0.15, 0.35] }}
                  transition={{
                    type: 'timing',
                    duration: 2200,
                    loop: true,
                    delay: index * 180,
                  }}
                  className="mb-2">
                  <View
                    className="mb-1.5 rounded-md bg-scroll-accent/70"
                    style={{ height: 8, width: 48 + (index % 3) * 8 }}
                  />
                  <View className="rounded-sm bg-white/15" style={{ height: 5, width: 56 }} />
                  <View className="mt-1 rounded-sm bg-white/10" style={{ height: 5, width: 42 }} />
                </MotiView>
              ))}
            </View>
          </View>
        </MotiView>

        <MotiView
          from={{ translateY: 0 }}
          animate={{ translateY: [0, 10, 0] }}
          transition={{ type: 'timing', duration: 1400, loop: true }}
          className="absolute top-[118px]">
          <Svg width={54} height={54} viewBox="0 0 54 54">
            <Circle cx="27" cy="27" r="26" fill="rgba(217,93,26,0.18)" />
            <Path
              d="M18 34c4-8 8-12 14-12s10 4 14 12"
              stroke={colors.accent}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <Circle cx="27" cy="18" r="4" fill={colors.accent} />
          </Svg>
        </MotiView>
      </MotiView>
    </View>
  );
}
