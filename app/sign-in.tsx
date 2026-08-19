import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { AuthPanel } from '@/components/auth/AuthPanel';

export default function SignInScreen() {
  const router = useRouter();

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1 px-4">
        <ScreenBackButton />
        <Text className="mt-4 text-scroll-text font-display text-[32px]">Sign in</Text>
        <Text className="text-scroll-muted font-body leading-[22px] mb-6">
          Display name, plus an email or phone number. Same account as onboarding.
        </Text>
        <View className="flex-1">
          <AuthPanel onAuthenticated={() => router.back()} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
