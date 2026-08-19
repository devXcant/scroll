import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import type { Request } from 'express';
import Stripe from 'stripe';
import { connectMongo } from './db.js';
import { registerUserRoutes } from './users.js';
import { registerAuthRoutes } from './auth.js';
import { registerCoachRoutes } from './coach.js';

const PORT = Number(process.env.PORT ?? 3001);
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

if (!stripeSecret) {
  console.warn('Missing STRIPE_SECRET_KEY in server/.env — payment routes disabled');
}

void connectMongo().catch(() => undefined);

const app = express();
const confirmedIntents = new Set<string>();
const INVESTED_PERCENT = 80;

app.use(cors());

app.post(
  '/payments/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res) => {
    if (!stripe) {
      res.status(503).json({ error: 'Payments not configured' });
      return;
    }
    const signature = req.headers['stripe-signature'];
    if (!webhookSecret || typeof signature !== 'string') {
      res.status(400).json({ error: 'Webhook not configured' });
      return;
    }
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Invalid webhook' });
      return;
    }
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      confirmedIntents.add(pi.id);
    }
    res.json({ received: true });
  }
);

app.use(express.json({ limit: '2mb' }));

registerUserRoutes(app);
registerAuthRoutes(app);
registerCoachRoutes(app);

app.post('/payments/create-subscription', async (req, res) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payments not configured' });
    return;
  }
  try {
    const plan = req.body?.plan === 'yearly' ? 'yearly' : 'monthly';
    const amountCents =
      typeof req.body?.amountCents === 'number'
        ? req.body.amountCents
        : plan === 'yearly'
          ? 4799
          : 699;
    if (amountCents < 100) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }
    const customer = await stripe.customers.create({
      metadata: { product: 'scroll_plus' },
    });
    const product = await stripe.products.create({ name: 'SCROLL Plus' });
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: amountCents,
      recurring: { interval: plan === 'yearly' ? 'year' : 'month' },
      product: product.id,
    });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    const invoice = subscription.latest_invoice;
    const intent =
      invoice && typeof invoice !== 'string' ? invoice.payment_intent : null;
    const clientSecret =
      intent && typeof intent !== 'string' ? intent.client_secret : null;
    if (!clientSecret) {
      res.status(500).json({ error: 'Could not start subscription payment' });
      return;
    }
    res.json({
      clientSecret,
      subscriptionId: subscription.id,
      customerId: customer.id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Stripe error' });
  }
});

app.post('/payments/create-intent', async (req, res) => {
  if (!stripe) {
    res.status(503).json({ error: 'Payments not configured' });
    return;
  }
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
  if (!stripe) {
    res.status(503).json({ error: 'Payments not configured' });
    return;
  }
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

    confirmedIntents.add(pi.id);
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
  res.json({ ok: true, payments: Boolean(stripe), webhook: Boolean(webhookSecret) });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SCROLL API http://0.0.0.0:${PORT}`);
});
