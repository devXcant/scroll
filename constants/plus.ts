export const PLUS_MONTHLY_CENTS = 699;
export const PLUS_YEARLY_CENTS = 4799;
export const PLUS_TRIAL_DAYS = 7;
export const FREE_TRACKED_APP_CAP = 3;

export type PlusPlan = 'trial' | 'monthly' | 'yearly' | null;

export function plusExpiresAt(plan: 'monthly' | 'yearly', from = Date.now()): string {
  const days = plan === 'yearly' ? 365 : 31;
  return new Date(from + days * 24 * 60 * 60 * 1000).toISOString();
}

export function trialEndsAt(from = Date.now()): string {
  return new Date(from + PLUS_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function isPlusActive(params: {
  plusExpiresAt: string | null;
  plusTrialEndsAt: string | null;
}): boolean {
  const now = Date.now();
  if (params.plusExpiresAt && new Date(params.plusExpiresAt).getTime() > now) return true;
  if (params.plusTrialEndsAt && new Date(params.plusTrialEndsAt).getTime() > now) return true;
  return false;
}

export function plusLabel(params: {
  plusPlan: PlusPlan;
  plusExpiresAt: string | null;
  plusTrialEndsAt: string | null;
}): string {
  if (params.plusExpiresAt && new Date(params.plusExpiresAt).getTime() > Date.now()) {
    return params.plusPlan === 'yearly' ? 'Plus yearly' : 'Plus';
  }
  if (params.plusTrialEndsAt && new Date(params.plusTrialEndsAt).getTime() > Date.now()) {
    const days = Math.max(
      1,
      Math.ceil((new Date(params.plusTrialEndsAt).getTime() - Date.now()) / 86400000)
    );
    return `${days} day${days === 1 ? '' : 's'} left on trial`;
  }
  return 'Free';
}
