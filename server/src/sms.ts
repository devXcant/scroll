type SendResult = { ok: true } | { ok: false; error: string };

export async function sendSms(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[sms] (dev, no Twilio) To ${to}: ${body}`);
      return { ok: true };
    }
    return { ok: false, error: 'SMS provider not configured on server.' };
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
      return { ok: false, error: text || 'Twilio send failed' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'SMS send failed' };
  }
}
