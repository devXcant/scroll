export function isInGracePeriod(unlockExpiresAt: string | null, now = Date.now()): boolean {
  if (!unlockExpiresAt) return false;
  return new Date(unlockExpiresAt).getTime() > now;
}
