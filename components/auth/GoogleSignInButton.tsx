import { useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, Text } from 'react-native';
import { useAppStore } from '@/stores/appStore';
import { GoogleLogo } from '@/components/auth/GoogleLogo';
import { isGoogleAuthConfigured, useGoogleAuthRequest } from '@/services/authGoogle';

type Props = {
  loading: boolean;
  setLoading: (value: boolean) => void;
  onAuthenticated?: () => void;
};

export function GoogleSignInButton({ loading, setLoading, onAuthenticated }: Props) {
  const completeGoogleSignIn = useAppStore((s) => s.completeGoogleSignIn);
  const [request, response, promptAsync] = useGoogleAuthRequest();

  useEffect(() => {
    void (async () => {
      if (response?.type !== 'success') return;
      const accessToken = response.authentication?.accessToken;
      if (!accessToken) return;
      setLoading(true);
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = (await profileRes.json()) as { name?: string; email?: string };
        const result = await completeGoogleSignIn(
          profile.name ?? 'SCROLL user',
          profile.email ?? ''
        );
        if (result.ok) onAuthenticated?.();
        else Alert.alert('Sign-in failed', 'Could not save your Google account.');
      } catch {
        Alert.alert('Sign-in failed', 'Could not reach Google.');
      } finally {
        setLoading(false);
      }
    })();
  }, [response, completeGoogleSignIn, onAuthenticated, setLoading]);

  const googleSignIn = async () => {
    if (!isGoogleAuthConfigured()) {
      Alert.alert(
        'Google sign-in',
        'Add EXPO_PUBLIC_GOOGLE_* client IDs to .env, or skip and continue.'
      );
      return;
    }
    setLoading(true);
    await promptAsync();
    setLoading(false);
  };

  const busy = loading && !!request;

  return (
    <Pressable
      disabled={busy}
      onPress={() => void googleSignIn()}
      className="h-[52px] w-full flex-row items-center justify-center rounded-xl border border-[#747775] bg-white active:opacity-90 disabled:opacity-60">
      {busy ? (
        <ActivityIndicator color="#1f1f1f" />
      ) : (
        <>
          <GoogleLogo size={20} />
          <Text className="ml-3 font-body-medium text-base text-[#1f1f1f]">Sign in with Google</Text>
        </>
      )}
    </Pressable>
  );
}
