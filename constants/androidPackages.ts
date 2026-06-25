import type { AppCategory } from '@/types';

/** Android package names for well-known apps (used to apply limits/category). */
export const ANDROID_CATALOG_PACKAGES: Record<
  string,
  { name: string; packageName: string; category: AppCategory; dailyLimitMinutes: number }
> = {
  instagram: {
    name: 'Instagram',
    packageName: 'com.instagram.android',
    category: 'social',
    dailyLimitMinutes: 60,
  },
  tiktok: {
    name: 'TikTok',
    packageName: 'com.zhiliaoapp.musically',
    category: 'social',
    dailyLimitMinutes: 45,
  },
  twitter: {
    name: 'X',
    packageName: 'com.twitter.android',
    category: 'social',
    dailyLimitMinutes: 30,
  },
  facebook: {
    name: 'Facebook',
    packageName: 'com.facebook.katana',
    category: 'social',
    dailyLimitMinutes: 45,
  },
  snapchat: {
    name: 'Snapchat',
    packageName: 'com.snapchat.android',
    category: 'social',
    dailyLimitMinutes: 40,
  },
  reddit: {
    name: 'Reddit',
    packageName: 'com.reddit.frontpage',
    category: 'social',
    dailyLimitMinutes: 45,
  },
  youtube: {
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    category: 'entertainment',
    dailyLimitMinutes: 90,
  },
  netflix: {
    name: 'Netflix',
    packageName: 'com.netflix.mediaclient',
    category: 'entertainment',
    dailyLimitMinutes: 120,
  },
  twitch: {
    name: 'Twitch',
    packageName: 'tv.twitch.android.app',
    category: 'entertainment',
    dailyLimitMinutes: 90,
  },
  spotify: {
    name: 'Spotify',
    packageName: 'com.spotify.music',
    category: 'entertainment',
    dailyLimitMinutes: 180,
  },
  discord: {
    name: 'Discord',
    packageName: 'com.discord',
    category: 'social',
    dailyLimitMinutes: 90,
  },
  telegram: {
    name: 'Telegram',
    packageName: 'org.telegram.messenger',
    category: 'social',
    dailyLimitMinutes: 60,
  },
  whatsapp: {
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    category: 'social',
    dailyLimitMinutes: 60,
  },
  roblox: {
    name: 'Roblox',
    packageName: 'com.roblox.client',
    category: 'games',
    dailyLimitMinutes: 60,
  },
  candycrush: {
    name: 'Candy Crush',
    packageName: 'com.king.candycrushsaga',
    category: 'games',
    dailyLimitMinutes: 45,
  },
  clash: {
    name: 'Clash of Clans',
    packageName: 'com.supercell.clashofclans',
    category: 'games',
    dailyLimitMinutes: 45,
  },
  chrome: {
    name: 'Chrome',
    packageName: 'com.android.chrome',
    category: 'other',
    dailyLimitMinutes: 120,
  },
};

const CATALOG_BY_PACKAGE = new Map(
  Object.values(ANDROID_CATALOG_PACKAGES).map((e) => [e.packageName.toLowerCase(), e])
);

export function catalogEntryForPackage(packageName: string) {
  return CATALOG_BY_PACKAGE.get(packageName.toLowerCase());
}
