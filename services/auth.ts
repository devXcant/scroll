import { getApiBaseUrl } from '@/lib/apiUrl';

const API_BASE = getApiBaseUrl();

export async function sendPhoneOtp(
  phone: string,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const normalized = phone.replace(/\D/g, '');
  const trimmedEmail = email.trim().toLowerCase();
  if (normalized.length < 10) {
    return { ok: false, error: 'Enter a valid phone number.' };
  }
  if (!trimmedEmail.includes('@')) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  if (!API_BASE) {
    return {
      ok: false,
      error: 'Server not configured. Set EXPO_PUBLIC_API_URL and run pnpm run api.',
    };
  }

  try {
    const res = await fetch(`${API_BASE}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalized, email: trimmedEmail }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      return { ok: false, error: data.error ?? 'Could not send code.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error sending code.' };
  }
}

export async function verifyPhoneOtp(
  phone: string,
  email: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const normalized = phone.replace(/\D/g, '');
  const trimmedEmail = email.trim().toLowerCase();
  if (code.length < 4) {
    return { ok: false, error: 'Enter the code from your email.' };
  }

  if (!API_BASE) {
    return { ok: false, error: 'Server not configured.' };
  }

  try {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalized, email: trimmedEmail, code }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      return { ok: false, error: data.error ?? 'Invalid code.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error verifying code.' };
  }
}
