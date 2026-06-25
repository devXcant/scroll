import { Text, View } from 'react-native';
import { MotiText, MotiView } from 'moti';
import { PhoneScrollIllustration } from '@/components/onboarding/PhoneScrollIllustration';

export function WelcomeHero() {
  return (
    <View className="flex-1 items-center justify-center px-2">
      <MotiView
        from={{ opacity: 0, scale: 0.92, translateY: 16 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 16, stiffness: 120 }}
        style={{ alignItems: 'center' }}>
        <View
          style={{
            height: 280,
            width: 280,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: 36,
          }}>
          <PhoneScrollIllustration />
        </View>

        <MotiText
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
          style={{
            marginTop: 20,
            fontFamily: 'SpaceGrotesk_700Bold',
            fontSize: 28,
            letterSpacing: 8,
            color: '#F4F4F8',
          }}>
          SCROLL
        </MotiText>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 700, delay: 400 }}
        style={{ alignItems: 'center', marginTop: 24, gap: 12 }}>
        <MotiText
          from={{ opacity: 0.55 }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ type: 'timing', duration: 2200, loop: true }}
          style={{
            textAlign: 'center',
            fontFamily: 'SpaceGrotesk_700Bold',
            fontSize: 34,
            lineHeight: 42,
            color: '#F4F4F8',
          }}>
          Stop scrolling.{'\n'}Start living.
        </MotiText>
      </MotiView>
    </View>
  );
}
