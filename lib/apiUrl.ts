import { Platform } from 'react-native';

/**
 * Resolve API base URL for the current runtime.
 * Android emulator cannot reach host "localhost" — use 10.0.2.2 instead.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:3001';
  if (Platform.OS !== 'android') return raw;

  if (raw.includes('localhost') || raw.includes('127.0.0.1')) {
    return raw
      .replace('localhost', '10.0.2.2')
      .replace('127.0.0.1', '10.0.2.2');
  }
  return raw;
}
