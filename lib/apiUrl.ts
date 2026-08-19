import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

function hostFromUri(uri: string | null | undefined): string | null {
  if (!uri) return null;
  const withoutScheme = uri.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
  const host = withoutScheme.split('/')[0]?.split(':')[0]?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host) && !host.includes('.')) return null;
  return host;
}

function metroLanHost(): string | null {
  const scriptURL = (NativeModules.SourceCode as { scriptURL?: string } | undefined)?.scriptURL;
  return (
    hostFromUri(Constants.expoConfig?.hostUri) ??
    hostFromUri((Constants as { debuggerHost?: string }).debuggerHost) ??
    hostFromUri(scriptURL)
  );
}

function replaceLoopbackHost(url: string, host: string): string {
  return url.replace('localhost', host).replace('127.0.0.1', host);
}

function isAndroidEmulator(): boolean {
  return Platform.OS === 'android' && (Constants as { isDevice?: boolean }).isDevice === false;
}

export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:3001';
  const loopback = /localhost|127\.0\.0\.1/.test(raw);
  if (!loopback || Platform.OS === 'web') return raw;

  const lan = metroLanHost();
  if (lan) return replaceLoopbackHost(raw, lan);
  if (isAndroidEmulator()) return replaceLoopbackHost(raw, '10.0.2.2');
  return raw;
}
