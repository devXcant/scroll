type SendResult = { ok: true } | { ok: false; error: string };

function userEmailError(status: number, body: string): string {
  if (status === 403) {
    return 'We could not email that address. Check it and try again.';
  }
  if (status === 422) {
    return 'That email address was rejected. Check it and try again.';
  }
  if (body.toLowerCase().includes('invalid')) {
    return 'That email address was rejected. Check it and try again.';
  }
  return 'We could not send a code to that email. Try again in a moment.';
}

export async function sendOtpEmail(to: string, code: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() ?? 'SCROLL <onboarding@resend.dev>';

  if (!key) {
    return { ok: false, error: 'Email sending is not set up yet. Use a phone number, or add an email provider.' };
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
      console.warn('[email] send failed', res.status, text.slice(0, 300));
      return { ok: false, error: userEmailError(res.status, text) };
    }
    return { ok: true };
  } catch (e) {
    console.warn('[email] send failed', e instanceof Error ? e.message : e);
    return { ok: false, error: 'We could not send a code to that email. Check your connection and try again.' };
  }
}
