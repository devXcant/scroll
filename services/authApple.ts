import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<{
  ok: boolean;
  displayName?: string;
  email?: string;
  error?: string;
}> {
  if (!(await isAppleSignInAvailable())) {
    return { ok: false, error: 'Sign in with Apple is not available on this device.' };
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const given = credential.fullName?.givenName?.trim();
    const family = credential.fullName?.familyName?.trim();
    const displayName = [given, family].filter(Boolean).join(' ') || 'SCROLL user';

    return {
      ok: true,
      displayName,
      email: credential.email ?? undefined,
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'ERR_REQUEST_CANCELED') {
      return { ok: false, error: 'cancelled' };
    }
    return { ok: false, error: 'Could not sign in with Apple.' };
  }
}
