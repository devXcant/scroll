import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: false }} />
      <GradientBackground>
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-16 h-16 rounded-full bg-scroll-surface border border-scroll-border items-center justify-center mb-6">
            <ScrollIcon name="compass" size={28} color={colors.icon} />
          </View>
          <Text className="text-scroll-text font-display text-[32px] mb-2">Page not found</Text>
          <Text className="text-scroll-muted font-body text-base text-center leading-[22px] mb-6 max-w-[280px]">
            This screen doesn't exist. Let's get you back to your dashboard.
          </Text>
          <Link
            href="/"
            className="px-6 py-3.5 rounded-xl bg-scroll-surface-hover border border-scroll-border-glow"
          >
            <Text className="text-scroll-text font-display-semibold text-base">Go to home</Text>
          </Link>
        </View>
      </GradientBackground>
    </>
  );
}
