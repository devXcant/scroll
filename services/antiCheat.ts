import AsyncStorage from '@react-native-async-storage/async-storage';
import { PENALTY_SECONDS } from '@/constants/lock';

const PAY_UNLOCK_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_PAY_UNLOCKS_PER_DAY = 6;
const ATTEMPTS_KEY = '@scroll/unlock_attempts';
const DAY_MS = 24 * 60 * 60 * 1000;

type UnlockAttempt = {
  method: 'pay' | 'read' | 'learn';
  appId?: string;
  at: number;
};

const attempts: UnlockAttempt[] = [];
let hydratePromise: Promise<void> | null = null;

function hydrateAttempts(): Promise<void> {
  if (!hydratePromise) {
    hydratePromise = (async () => {
      const raw = await AsyncStorage.getItem(ATTEMPTS_KEY);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as UnlockAttempt[];
        const cutoff = Date.now() - DAY_MS;
        if (Array.isArray(parsed)) {
          attempts.push(...parsed.filter((a) => a && a.at >= cutoff));
        }
      } catch {
        /* ignore corrupt cache */
      }
    })();
  }
  return hydratePromise;
}

void hydrateAttempts();

export async function ensureUnlockAttemptsHydrated(): Promise<void> {
  await hydrateAttempts();
}

function persistAttempts(): void {
  void AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

let penalizeCallback: ((seconds: number, reason: string) => void) | null = null;

export function registerLockPenalizer(
  fn: (seconds: number, reason: string) => void
): void {
  penalizeCallback = fn;
}

export function penalizeSillyAttempt(reason: string, seconds = PENALTY_SECONDS): void {
  penalizeCallback?.(seconds, reason);
}

export function recordUnlockAttempt(
  method: UnlockAttempt['method'],
  appId?: string
): void {
  attempts.push({ method, appId, at: Date.now() });
  const cutoff = Date.now() - DAY_MS;
  while (attempts.length > 0 && attempts[0].at < cutoff) {
    attempts.shift();
  }
  persistAttempts();
}

export function getPayUnlockCooldownMs(appId?: string): number {
  const lastPay = [...attempts]
    .reverse()
    .find((a) => a.method === 'pay' && (!appId || a.appId === appId));
  if (!lastPay) return 0;
  const left = PAY_UNLOCK_COOLDOWN_MS - (Date.now() - lastPay.at);
  return Math.max(0, left);
}

export function canPayUnlock(appId?: string): {
  ok: boolean;
  reason?: string;
  cooldownMs?: number;
} {
  const todayPay = attempts.filter(
    (a) => a.method === 'pay' && (!appId || a.appId === appId)
  ).length;
  if (todayPay >= MAX_PAY_UNLOCKS_PER_DAY) {
    return {
      ok: false,
      reason: 'Daily pay-unlock limit reached for this app. Try reading or a lesson.',
    };
  }
  const cooldownMs = getPayUnlockCooldownMs(appId);
  if (cooldownMs > 0) {
    return {
      ok: false,
      reason: 'Pay unlock on cooldown',
      cooldownMs,
    };
  }
  return { ok: true };
}

export function getPayUnlockCountToday(appId?: string): number {
  const cutoff = Date.now() - DAY_MS;
  return attempts.filter(
    (a) => a.method === 'pay' && a.at >= cutoff && (!appId || a.appId === appId)
  ).length;
}
