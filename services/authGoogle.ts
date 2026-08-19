import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

function envId(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getGoogleClientIds() {
  return {
    iosClientId: envId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
    androidClientId: envId(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
    webClientId: envId(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  };
}

export function isGoogleAuthConfigured(): boolean {
  const ids = getGoogleClientIds();
  if (Platform.OS === 'android') return Boolean(ids.androidClientId);
  if (Platform.OS === 'ios') return Boolean(ids.iosClientId);
  return Boolean(ids.webClientId);
}

export function useGoogleAuthRequest() {
  const ids = getGoogleClientIds();
  return Google.useAuthRequest({
    iosClientId: ids.iosClientId,
    androidClientId: ids.androidClientId,
    webClientId: ids.webClientId,
  });
}
