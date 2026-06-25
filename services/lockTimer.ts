import { INITIAL_LOCK_SECONDS, MIN_LOCK_REMAINING_SECONDS } from '@/constants/lock';

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function secondsUntil(isoEnd: string | null, now = Date.now()): number {
  if (!isoEnd) return 0;
  return Math.max(0, Math.floor((new Date(isoEnd).getTime() - now) / 1000));
}

export function computeReducedLockEnd(
  lockEndsAt: string,
  lockMinEndsAt: string,
  reduceSeconds: number
): string {
  const end = new Date(lockEndsAt).getTime();
  const floor = new Date(lockMinEndsAt).getTime();
  const next = Math.max(floor, end - reduceSeconds * 1000);
  return new Date(next).toISOString();
}

export function computePenalizedLockEnd(lockEndsAt: string, penaltySeconds: number): string {
  const end = new Date(lockEndsAt).getTime();
  return new Date(end + penaltySeconds * 1000).toISOString();
}

export function createInitialLockEnds(): { lockEndsAt: string; lockMinEndsAt: string } {
  const now = Date.now();
  return {
    lockEndsAt: new Date(now + INITIAL_LOCK_SECONDS * 1000).toISOString(),
    lockMinEndsAt: new Date(now + MIN_LOCK_REMAINING_SECONDS * 1000).toISOString(),
  };
}
