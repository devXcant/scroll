import { Platform } from 'react-native';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { isStripeNativeAvailable } from '@/lib/stripeNative';
import { isStripeConfigured } from '@/services/stripeUnlock';
import { PLUS_MONTHLY_CENTS, PLUS_YEARLY_CENTS, plusExpiresAt } from '@/constants/plus';

export type PlusCheckoutResult = {
  ok: boolean;
  plan?: 'monthly' | 'yearly';
  expiresAt?: string;
  error?: string;
};

export async function startPlusCheckout(plan: 'monthly' | 'yearly'): Promise<PlusCheckoutResult> {
  if (!isStripeConfigured()) {
    return {
      ok: false,
      error: 'Payments are not set up yet. You can still use the 7-day trial.',
    };
  }
  if (!isStripeNativeAvailable()) {
    return { ok: false, error: 'Payments need the SCROLL app build, not Expo Go.' };
  }

  const amountCents = plan === 'yearly' ? PLUS_YEARLY_CENTS : PLUS_MONTHLY_CENTS;
  try {
    const res = await fetch(`${getApiBaseUrl()}/payments/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, amountCents }),
    });
    const data = (await res.json()) as {
      clientSecret?: string;
      subscriptionId?: string;
      error?: string;
    };
    if (!res.ok || !data.clientSecret) {
      return { ok: false, error: data.error ?? 'Could not start Plus checkout.' };
    }

    const { initPaymentSheet, presentPaymentSheet } = await import('@stripe/stripe-react-native');
    const applePay = Platform.OS === 'ios' ? { merchantCountryCode: 'US' } : undefined;
    const googlePay =
      Platform.OS === 'android'
        ? {
            merchantCountryCode: 'US',
            testEnv: __DEV__,
            amount: (amountCents / 100).toFixed(2),
            label: plan === 'yearly' ? 'SCROLL Plus yearly' : 'SCROLL Plus monthly',
          }
        : undefined;

    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: data.clientSecret,
      merchantDisplayName: 'SCROLL',
      applePay,
      googlePay,
      allowsDelayedPaymentMethods: false,
      returnURL: 'scroll://plus',
    });
    if (initError) {
      return { ok: false, error: initError.message ?? 'Could not open payment.' };
    }

    const { error: presentError } = await presentPaymentSheet();
    if (presentError) {
      if (presentError.code === 'Canceled') {
        return { ok: false, error: 'Checkout canceled' };
      }
      return { ok: false, error: presentError.message };
    }

    return { ok: true, plan, expiresAt: plusExpiresAt(plan) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}
