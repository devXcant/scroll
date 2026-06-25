import { getApiBaseUrl } from '@/lib/apiUrl';
import type { CoachSession, PortfolioSummary, TrackedApp, UsageSnapshot } from '@/types';

export type UserPermissions = {
  shieldEnabled: boolean;
  usageStats: boolean;
  overlay: boolean;
  notifications: boolean;
  syncCoachToCloud: boolean;
};

export type UserProfile = {
  deviceId: string;
  displayName: string;
  email: string | null;
  permissions: UserPermissions;
  paymentCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserAppState = {
  apps: TrackedApp[];
  usage: UsageSnapshot[];
  portfolio: PortfolioSummary;
  coachSessions: CoachSession[];
  onboardingComplete: boolean;
};

const defaultPermissions = (): UserPermissions => ({
  shieldEnabled: true,
  usageStats: true,
  overlay: true,
  notifications: true,
  syncCoachToCloud: true,
});

async function api<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export async function bootstrapUser(
  deviceId: string,
  displayName?: string
): Promise<UserProfile | null> {
  const result = await api<UserProfile>('/users/bootstrap', {
    method: 'POST',
    body: JSON.stringify({ deviceId, displayName }),
  });
  return result.ok ? result.data : null;
}

export async function fetchUserProfile(deviceId: string): Promise<UserProfile | null> {
  const result = await api<UserProfile>(`/users/${encodeURIComponent(deviceId)}`);
  return result.ok ? result.data : null;
}

export async function patchUserProfile(
  deviceId: string,
  patch: Partial<Pick<UserProfile, 'displayName' | 'email' | 'permissions'>> & { phone?: string }
): Promise<UserProfile | null> {
  const result = await api<UserProfile>(`/users/${encodeURIComponent(deviceId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return result.ok ? result.data : null;
}

export async function syncUserState(
  deviceId: string,
  state: UserAppState
): Promise<boolean> {
  const result = await api<{ saved: boolean }>(
    `/users/${encodeURIComponent(deviceId)}/state`,
    {
      method: 'PUT',
      body: JSON.stringify(state),
    }
  );
  return result.ok;
}

export async function fetchUserState(deviceId: string): Promise<UserAppState | null> {
  const result = await api<UserAppState>(
    `/users/${encodeURIComponent(deviceId)}/state`
  );
  return result.ok ? result.data : null;
}

export async function deleteUserAccount(deviceId: string): Promise<boolean> {
  const result = await api<{ deleted: boolean }>(
    `/users/${encodeURIComponent(deviceId)}`,
    { method: 'DELETE' }
  );
  return result.ok;
}

export async function logUserEvent(
  deviceId: string,
  event: string,
  meta?: Record<string, string>
): Promise<void> {
  await api('/users/log', {
    method: 'POST',
    body: JSON.stringify({ deviceId, event, meta, at: new Date().toISOString() }),
  });
}

export { defaultPermissions };
