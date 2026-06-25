import type { AppCategory, TrackedApp } from '@/types';

/** Catalog for picker — production uses native installed-app list + this filter */
export type CatalogApp = TrackedApp & {
  searchable: string;
  isSystem?: boolean;
};

export const APP_CATALOG: CatalogApp[] = [
  { id: 'instagram', name: 'Instagram', bundleId: 'com.burbn.instagram', category: 'social', dailyLimitMinutes: 60, searchable: 'instagram ig meta' },
  { id: 'tiktok', name: 'TikTok', bundleId: 'com.zhiliaoapp.musically', category: 'social', dailyLimitMinutes: 45, searchable: 'tiktok bytedance' },
  { id: 'twitter', name: 'X', bundleId: 'com.atebits.Tweetie2', category: 'social', dailyLimitMinutes: 30, searchable: 'twitter x social' },
  { id: 'facebook', name: 'Facebook', bundleId: 'com.facebook.Facebook', category: 'social', dailyLimitMinutes: 45, searchable: 'facebook meta' },
  { id: 'snapchat', name: 'Snapchat', bundleId: 'com.toyopagroup.picaboo', category: 'social', dailyLimitMinutes: 40, searchable: 'snapchat snap' },
  { id: 'reddit', name: 'Reddit', bundleId: 'com.reddit.Reddit', category: 'social', dailyLimitMinutes: 45, searchable: 'reddit' },
  { id: 'youtube', name: 'YouTube', bundleId: 'com.google.ios.youtube', category: 'entertainment', dailyLimitMinutes: 90, searchable: 'youtube google video' },
  { id: 'netflix', name: 'Netflix', bundleId: 'com.netflix.Netflix', category: 'entertainment', dailyLimitMinutes: 120, searchable: 'netflix stream' },
  { id: 'twitch', name: 'Twitch', bundleId: 'tv.twitch', category: 'entertainment', dailyLimitMinutes: 90, searchable: 'twitch stream amazon' },
  { id: 'spotify', name: 'Spotify', bundleId: 'com.spotify.client', category: 'entertainment', dailyLimitMinutes: 180, searchable: 'spotify music' },
  { id: 'discord', name: 'Discord', bundleId: 'com.hammerandchisel.discord', category: 'social', dailyLimitMinutes: 90, searchable: 'discord chat' },
  { id: 'telegram', name: 'Telegram', bundleId: 'ph.telegra.Telegraph', category: 'social', dailyLimitMinutes: 60, searchable: 'telegram' },
  { id: 'whatsapp', name: 'WhatsApp', bundleId: 'net.whatsapp.WhatsApp', category: 'social', dailyLimitMinutes: 60, searchable: 'whatsapp meta' },
  { id: 'pinterest', name: 'Pinterest', bundleId: 'pinterest', category: 'social', dailyLimitMinutes: 40, searchable: 'pinterest' },
  { id: 'linkedin', name: 'LinkedIn', bundleId: 'com.linkedin.LinkedIn', category: 'social', dailyLimitMinutes: 30, searchable: 'linkedin work' },
  { id: 'roblox', name: 'Roblox', bundleId: 'com.roblox.robloxmobile', category: 'games', dailyLimitMinutes: 60, searchable: 'roblox game' },
  { id: 'candycrush', name: 'Candy Crush', bundleId: 'com.king.candycrushsaga', category: 'games', dailyLimitMinutes: 45, searchable: 'candy crush king game' },
  { id: 'clash', name: 'Clash of Clans', bundleId: 'com.supercell.magic', category: 'games', dailyLimitMinutes: 45, searchable: 'clash supercell' },
  { id: 'chrome', name: 'Chrome', bundleId: 'com.google.chrome.ios', category: 'other', dailyLimitMinutes: 120, searchable: 'chrome browser google' },
  { id: 'safari', name: 'Safari', bundleId: 'com.apple.mobilesafari', category: 'other', dailyLimitMinutes: 120, searchable: 'safari browser apple', isSystem: true },
  { id: 'settings', name: 'Settings', bundleId: 'com.apple.Preferences', category: 'other', dailyLimitMinutes: 0, searchable: 'settings ios', isSystem: true },
  { id: 'phone', name: 'Phone', bundleId: 'com.apple.mobilephone', category: 'other', dailyLimitMinutes: 0, searchable: 'phone dial', isSystem: true },
];

export function searchCatalog(query: string, excludeSystem = true): CatalogApp[] {
  const q = query.trim().toLowerCase();
  return APP_CATALOG.filter((app) => {
    if (excludeSystem && app.isSystem) return false;
    if (!q) return true;
    return (
      app.name.toLowerCase().includes(q) ||
      app.searchable.includes(q) ||
      app.bundleId.toLowerCase().includes(q)
    );
  });
}
