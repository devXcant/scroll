import AsyncStorage from '@react-native-async-storage/async-storage';

const POINTS_KEY = '@scroll/points';

export const POINTS_PER_READ_PAGE = 1;
export const POINTS_LOCK_REDUCE_COST = 60;
export const POINTS_LOCK_REDUCE_SECONDS = 90;
export const POINTS_GRACE_UNLOCK_COST = 180;
export const POINTS_GRACE_UNLOCK_MINUTES = 15;

export async function loadScrollPoints(): Promise<number> {
  const raw = await AsyncStorage.getItem(POINTS_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export async function saveScrollPoints(points: number): Promise<void> {
  await AsyncStorage.setItem(POINTS_KEY, String(Math.max(0, Math.floor(points))));
}

export async function addScrollPoints(delta: number): Promise<number> {
  const next = (await loadScrollPoints()) + Math.max(0, delta);
  await saveScrollPoints(next);
  return next;
}

export async function spendScrollPoints(cost: number): Promise<{ ok: boolean; balance: number }> {
  const balance = await loadScrollPoints();
  if (balance < cost) return { ok: false, balance };
  const next = balance - cost;
  await saveScrollPoints(next);
  return { ok: true, balance: next };
}
