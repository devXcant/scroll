import { getApiBaseUrl } from '@/lib/apiUrl';

function digits(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isValidEmail(email: string): boolean {
  const value = email.trim().toLowerCase();
  return value.includes('@') && value.includes('.');
}

function isValidPhone(phone: string): boolean {
  return digits(phone).length >= 10;
}

function contactKeys(phone: string, email: string): { phone: string; email: string } {
  const normalized = digits(phone);
  const trimmedEmail = email.trim().toLowerCase();
  return {
    phone: isValidPhone(normalized) ? normalized : '',
    email: isValidEmail(trimmedEmail) ? trimmedEmail : '',
  };
}

export async function sendPhoneOtp(
  phone: string,
  email: string
): Promise<{
  ok: boolean;
  error?: string;
  emailed?: boolean;
  texted?: boolean;
}> {
  const keys = contactKeys(phone, email);
  const typedPhone = phone.replace(/\D/g, '').length > 0;
  const typedEmail = email.trim().length > 0;

  if (!keys.phone && !keys.email) {
    if (typedEmail) return { ok: false, error: 'That email does not look right.' };
    if (typedPhone) return { ok: false, error: 'That phone number looks too short.' };
    return { ok: false, error: 'Add an email or a phone number so we can send your code.' };
  }

  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return { ok: false, error: 'We could not send a code. Check your connection and try again.' };
  }

  try {
    const res = await fetch(`${apiBase}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: keys.phone, email: keys.email }),
    });
    const data = (await res.json()) as {
      error?: string;
      emailed?: boolean;
      texted?: boolean;
    };
    if (!res.ok || (!data.emailed && !data.texted)) {
      return {
        ok: false,
        error: data.error ?? 'We could not send a code. Try email or phone again.',
      };
    }
    return { ok: true, emailed: Boolean(data.emailed), texted: Boolean(data.texted) };
  } catch {
    return { ok: false, error: 'We could not send a code. Check your connection and try again.' };
  }
}

export async function verifyPhoneOtp(
  phone: string,
  email: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmedCode = code.trim();
  if (trimmedCode.length < 4) {
    return { ok: false, error: 'Enter the 6 digit code we sent you.' };
  }

  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return { ok: false, error: 'We could not check that code. Check your connection and try again.' };
  }

  const keys = contactKeys(phone, email);
  try {
    const res = await fetch(`${apiBase}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: keys.phone, email: keys.email, code: trimmedCode }),
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: 'That code is not right. Try again or resend a new one.' };
  } catch {
    return { ok: false, error: 'We could not check that code. Check your connection and try again.' };
  }
}
