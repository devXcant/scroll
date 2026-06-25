import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'scroll_user_id';

export async function getOrCreateDeviceUserId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(USER_ID_KEY);
    if (existing) return existing;
  } catch {
    const fallback = await AsyncStorage.getItem(USER_ID_KEY);
    if (fallback) return fallback;
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    await SecureStore.setItemAsync(USER_ID_KEY, id);
  } catch {
    await AsyncStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}
