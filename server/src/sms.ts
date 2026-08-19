type SendResult = { ok: true } | { ok: false; error: string };

export async function sendSms(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!sid || !token || !from) {
    return { ok: false, error: 'Texting is not set up yet. Use email instead.' };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.warn('[sms] send failed', res.status, text.slice(0, 300));
      return { ok: false, error: 'We could not text that number. Check it and try again, or use email.' };
    }
    return { ok: true };
  } catch (e) {
    console.warn('[sms] send failed', e instanceof Error ? e.message : e);
    return { ok: false, error: 'We could not text that number. Check your connection and try again.' };
  }
}
