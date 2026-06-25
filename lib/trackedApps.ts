import type { TrackedApp } from '@/types';

export type IosBlockedItemSnapshot = {
  type: 'app' | 'category' | 'webDomain';
  token: string;
  bundleIdentifier?: string;
  displayName?: string;
  categoryName?: string;
};

function categoryFromLabel(label: string): TrackedApp['category'] {
  const lower = label.toLowerCase();
  if (lower.includes('game')) return 'games';
  if (lower.includes('social')) return 'social';
  if (lower.includes('entertain') || lower.includes('creativ')) return 'entertainment';
  return 'other';
}

function iosItemBaseId(item: IosBlockedItemSnapshot): string {
  if (item.type === 'app' && item.bundleIdentifier) {
    return item.bundleIdentifier.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
  return `cat_${item.token.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
}

/** Ensure every tracked app has a unique id (iOS category tokens can collide when truncated). */
export function dedupeTrackedApps(apps: TrackedApp[]): TrackedApp[] {
  const used = new Set<string>();
  return apps.map((app) => {
    let id = app.id;
    if (used.has(id)) {
      let n = 2;
      while (used.has(`${app.id}_${n}`)) n += 1;
      id = `${app.id}_${n}`;
    }
    used.add(id);
    return id === app.id ? app : { ...app, id };
  });
}

export function trackedAppsFromIosItems(items: IosBlockedItemSnapshot[]): TrackedApp[] {
  const apps: TrackedApp[] = [];
  const usedIds = new Set<string>();

  for (const item of items) {
    let id = iosItemBaseId(item);
    if (usedIds.has(id)) {
      let n = 2;
      while (usedIds.has(`${id}_${n}`)) n += 1;
      id = `${id}_${n}`;
    }
    usedIds.add(id);

    if (item.type === 'app' && item.bundleIdentifier) {
      apps.push({
        id,
        name: item.displayName ?? item.bundleIdentifier,
        bundleId: item.bundleIdentifier,
        category: 'social',
        dailyLimitMinutes: 60,
      });
    } else if (item.type === 'category') {
      const label = item.categoryName ?? item.displayName ?? 'Category';
      apps.push({
        id,
        name: label,
        bundleId: item.token,
        category: categoryFromLabel(label),
        dailyLimitMinutes: 60,
      });
    }
  }

  return apps;
}
