type SendResult = { ok: true } | { ok: false; error: string };

export async function sendOtpEmail(to: string, code: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() ?? 'SCROLL <onboarding@resend.dev>';

  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email] (dev, no Resend) To ${to}: code ${code}`);
      return { ok: true };
    }
    return { ok: false, error: 'Email provider not configured (RESEND_API_KEY).' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Your SCROLL verification code',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px">
            <h1 style="font-size:20px;margin:0 0 12px">SCROLL verification</h1>
            <p style="color:#444;line-height:1.5">Use this code to finish signing in. It expires in 10 minutes.</p>
            <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</p>
            <p style="color:#888;font-size:12px">If you did not request this, ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || 'Resend send failed' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Email send failed' };
  }
}
