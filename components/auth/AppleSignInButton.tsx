import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import Svg, { Path } from 'react-native-svg';
import { useAppStore } from '@/stores/appStore';
import { isAppleSignInAvailable, signInWithApple } from '@/services/authApple';

type Props = {
  setLoading: (value: boolean) => void;
  onAuthenticated?: () => void;
};

function AppleLogo({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 814 1000">
      <Path
        fill={color}
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-163.7-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
      />
    </Svg>
  );
}

export function AppleSignInButton({ setLoading, onAuthenticated }: Props) {
  const completeAppleSignIn = useAppStore((s) => s.completeAppleSignIn);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void isAppleSignInAvailable().then(setAvailable);
  }, []);

  if (Platform.OS !== 'ios') return null;

  const handlePress = async () => {
    setLoading(true);
    const result = await signInWithApple();
    if (!result.ok) {
      setLoading(false);
      if (result.error !== 'cancelled') {
        Alert.alert('Sign-in failed', result.error ?? 'Could not sign in with Apple.');
      }
      return;
    }
    const saved = await completeAppleSignIn(result.displayName ?? 'SCROLL user', result.email);
    setLoading(false);
    if (saved.ok) onAuthenticated?.();
    else Alert.alert('Sign-in failed', 'Could not save your Apple account.');
  };

  if (available) {
    return (
      <View className="w-full overflow-hidden rounded-xl">
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={12}
          style={{ width: '100%', height: 52 }}
          onPress={() => void handlePress()}
        />
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => {
        if (available === false) {
          Alert.alert(
            'Apple sign-in',
            'Sign in with Apple needs a device with Apple ID or a fresh dev build (pnpm run ios).'
          );
          return;
        }
        void handlePress();
      }}
      className="h-[52px] w-full flex-row items-center justify-center rounded-xl bg-white active:opacity-90">
      <AppleLogo />
      <Text className="ml-3 font-body-medium text-base text-black">Sign in with Apple</Text>
    </Pressable>
  );
}
