import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';

export default function SignInScreen() {
  const router = useRouter();
  const completeSignIn = useAppStore((s) => s.completeSignIn);
  const signedInProfile = useAppStore((s) => s.signedInProfile);

  const [displayName, setDisplayName] = useState(signedInProfile?.displayName ?? '');
  const [email, setEmail] = useState(signedInProfile?.email ?? '');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const result = await completeSignIn(displayName, email);
    setLoading(false);
    if (!result.ok) {
      Alert.alert('Check your email', 'Enter a valid email and display name.');
      return;
    }
    Alert.alert('Saved', 'Your details are saved on this device and synced to SCROLL.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1 px-4">
        <KeyboardAvoidingView
          className="flex-1 justify-center gap-4"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Text className="text-scroll-text font-display text-[32px]">Save your account</Text>
          <Text className="text-scroll-muted font-body leading-[22px] mb-4">
            One-time sign-in, no password. We store your name and email so your profile and
            settings follow this device.
          </Text>

          <GlassCard className="mb-4">
            <Text className="text-scroll-dim font-body text-xs mb-1.5 mt-2">Display name</Text>
            <TextInput
              className="bg-scroll-card rounded-xl border border-scroll-border px-3.5 py-3 text-scroll-text font-body"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={colors.textDim}
              autoCapitalize="words"
            />
            <Text className="text-scroll-dim font-body text-xs mb-1.5 mt-2">Email</Text>
            <TextInput
              className="bg-scroll-card rounded-xl border border-scroll-border px-3.5 py-3 text-scroll-text font-body"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={colors.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </GlassCard>

          <Button label="Save & continue" onPress={() => void save()} loading={loading} />
          <Button variant="ghost" label="Skip for now" onPress={() => router.back()} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
