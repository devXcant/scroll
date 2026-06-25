import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import Stripe from 'stripe';
import { connectMongo } from './db.js';
import { registerUserRoutes } from './users.js';
import { registerAuthRoutes } from './auth.js';
import { registerCoachRoutes } from './coach.js';

const PORT = Number(process.env.PORT ?? 3001);
const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  console.error('Missing STRIPE_SECRET_KEY in server/.env');
  process.exit(1);
}

void connectMongo();

const stripe = new Stripe(stripeSecret);
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

registerUserRoutes(app);
registerAuthRoutes(app);
registerCoachRoutes(app);

const INVESTED_PERCENT = 80;

app.post('/payments/create-intent', async (req, res) => {
  try {
    const { amountCents, unlockMinutes, method } = req.body ?? {};
    if (!amountCents || amountCents < 50) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'scroll_unlock',
        unlockMinutes: String(unlockMinutes ?? 15),
        method: method ?? 'sheet',
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Stripe error' });
  }
});

app.post('/payments/confirm-unlock', async (req, res) => {
  try {
    const { paymentIntentId } = req.body ?? {};
    if (!paymentIntentId) {
      res.status(400).json({ error: 'Missing paymentIntentId' });
      return;
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      res.status(402).json({
        success: false,
        error: `Payment not completed (${pi.status})`,
      });
      return;
    }

    const feeCents = pi.amount;
    const investedCents = Math.round(feeCents * (INVESTED_PERCENT / 100));
    const platformCents = feeCents - investedCents;

    res.json({
      success: true,
      paymentIntentId: pi.id,
      investedCents,
      platformCents,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Confirm failed' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`SCROLL API http://localhost:${PORT}`);
});
