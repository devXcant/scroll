import type { Express } from 'express';
import { sendOtpEmail } from './email.js';
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

export function registerAuthRoutes(app: Express): void {
  app.post('/auth/otp/send', async (req, res) => {
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    const email = normalizeEmail(String(req.body?.email ?? ''));

    if (phone.length < 10) {
      res.status(400).json({ error: 'Invalid phone number' });
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    const code = randomCode();
    await saveOtp(phone, email, code, 10 * 60 * 1000);

    const sent = await sendOtpEmail(email, code);
    if (!sent.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[auth] OTP for ${email} / +${phone}: ${code}`);
        res.json({ ok: true });
        return;
      }
      res.status(502).json({ error: sent.error });
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[auth] OTP emailed to ${email} (phone +${phone}): ${code}`);
    }
    res.json({ ok: true });
  });

  app.post('/auth/otp/verify', async (req, res) => {
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    const email = normalizeEmail(String(req.body?.email ?? ''));
    const code = String(req.body?.code ?? '').trim();

    if (!code) {
      res.status(400).json({ error: 'Code required' });
      return;
    }

    const ok = await verifyStoredOtp(phone, email, code);
    if (!ok) {
      res.status(401).json({ error: 'Invalid or expired code.' });
      return;
    }
    res.json({ ok: true, email, phone });
  });
}
