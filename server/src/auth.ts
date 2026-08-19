import type { Express } from 'express';
import { sendOtpEmail } from './email.js';
import { sendSms } from './sms.js';
import { saveOtp, verifyOtp as verifyStoredOtp } from './store.js';

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function toE164(value: string): string {
  return value.startsWith('+') ? value : `+${value}`;
}

function isValidEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}

export function registerAuthRoutes(app: Express): void {
  app.post('/auth/otp/send', async (req, res) => {
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    const email = normalizeEmail(String(req.body?.email ?? ''));
    const hasPhone = phone.length >= 10;
    const hasEmail = isValidEmail(email);

    if (!hasPhone && !hasEmail) {
      res.status(400).json({ error: 'Add an email or a phone number so we can send your code.' });
      return;
    }

    const code = randomCode();
    await saveOtp(hasPhone ? phone : '', hasEmail ? email : '', code, 10 * 60 * 1000);

    const [emailed, texted] = await Promise.all([
      hasEmail
        ? sendOtpEmail(email, code)
        : Promise.resolve({ ok: false as const, error: 'skipped' }),
      hasPhone
        ? sendSms(toE164(phone), `SCROLL code: ${code}. Expires in 10 minutes.`)
        : Promise.resolve({ ok: false as const, error: 'skipped' }),
    ]);

    const deliveredEmail = hasEmail && emailed.ok;
    const deliveredSms = hasPhone && texted.ok;
    if (!deliveredEmail && !deliveredSms) {
      const emailError = emailed.ok ? 'We could not send a code to that email.' : emailed.error;
      const smsError = texted.ok ? 'We could not text that number.' : texted.error;
      const error = hasEmail ? emailError : smsError;
      res.status(502).json({ error, emailed: false, texted: false });
      return;
    }

    console.log(
      `[auth] OTP sent emailed=${deliveredEmail} texted=${deliveredSms}`
    );

    res.json({
      ok: true,
      emailed: deliveredEmail,
      texted: deliveredSms,
    });
  });

  app.post('/auth/otp/verify', async (req, res) => {
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    const email = normalizeEmail(String(req.body?.email ?? ''));
    const code = String(req.body?.code ?? '').trim();

    if (!code) {
      res.status(400).json({ error: 'Enter your verification code.' });
      return;
    }

    const ok = await verifyStoredOtp(
      phone.length >= 10 ? phone : '',
      isValidEmail(email) ? email : '',
      code
    );
    if (!ok) {
      res.status(401).json({ error: 'That code is not right. Try again or resend a new one.' });
      return;
    }
    res.json({ ok: true, email, phone });
  });
}
