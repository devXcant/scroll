import { Platform } from 'react-native';

type GlassModule = typeof import('expo-glass-effect');

let cached: { available: boolean; mod: GlassModule | null } | null = null;

export function getGlassModule(): { available: boolean; mod: GlassModule | null } {
  if (cached) return cached;
  if (Platform.OS !== 'ios') {
    cached = { available: false, mod: null };
    return cached;
  }
  try {
    const mod = require('expo-glass-effect') as GlassModule;
    const available = mod.isGlassEffectAPIAvailable?.() ?? false;
    cached = { available, mod };
    return cached;
  } catch {
    cached = { available: false, mod: null };
    return cached;
  }
}
