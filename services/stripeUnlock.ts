import { Platform } from 'react-native';
import type { PaymentResult } from '@/services/payments';
import type { PaymentTier } from '@/types';
import { isStripeNativeAvailable } from '@/lib/stripeNative';
import { getApiBaseUrl } from '@/lib/apiUrl';

const API_BASE = getApiBaseUrl();

type CreateIntentResponse = {
  clientSecret: string;
  paymentIntentId: string;
  error?: string;
};

async function createPaymentIntent(
  tier: PaymentTier,
  method: 'wallet' | 'payment_sheet' = 'payment_sheet'
): Promise<CreateIntentResponse | { error: string }> {
  try {
    const res = await fetch(`${API_BASE}/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountCents: tier.amountCents,
        unlockMinutes: tier.unlockMinutes,
        method,
      }),
    });
    const data = (await res.json()) as CreateIntentResponse & { error?: string };
    if (!res.ok) {
      return { error: data.error ?? 'Could not start payment' };
    }
    if (!data.clientSecret || !data.paymentIntentId) {
      return { error: 'Invalid payment response' };
    }
    return data;
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? `${e.message}. Is the API running? (${API_BASE})`
          : 'Network error',
    };
  }
}

async function confirmOnServer(paymentIntentId: string): Promise<PaymentResult> {
  try {
    const res = await fetch(`${API_BASE}/payments/confirm-unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId }),
    });
    const data = (await res.json()) as PaymentResult & { error?: string };
    if (!res.ok || !data.success) {
      return { success: false, error: data.error ?? 'Payment not confirmed' };
    }
    return data;
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Confirm failed',
    };
  }
}

function formatDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function isApplePayAvailable(): Promise<boolean> {
  return isWalletPayAvailable();
}

/** Native Apple Pay (iOS) or Google Pay (Android) via Stripe Platform Pay */
export async function isWalletPayAvailable(): Promise<boolean> {
  if (!isStripeConfigured()) return false;
  try {
    const { isPlatformPaySupported } = await import('@stripe/stripe-react-native');
    if (Platform.OS === 'android') {
      return await isPlatformPaySupported({ googlePay: { testEnv: __DEV__ } });
    }
    if (Platform.OS === 'ios') {
      return await isPlatformPaySupported();
    }
    return false;
  } catch {
    return false;
  }
}

/** One-tap wallet checkout — opens native Apple Pay / Google Pay sheet */
export async function payUnlockWithWallet(tier: PaymentTier): Promise<PaymentResult> {
  if (!isStripeNativeAvailable()) {
    return {
      success: false,
      error: 'Real payments need a dev build (expo run:ios / run:android).',
    };
  }

  const { confirmPlatformPayPayment, PlatformPay } = await import(
    '@stripe/stripe-react-native'
  );

  const intent = await createPaymentIntent(tier, 'wallet');
  if ('error' in intent) {
    return { success: false, error: intent.error };
  }

  const { clientSecret, paymentIntentId } = intent;
  const amount = formatDollars(tier.amountCents);
  const label = `SCROLL unlock (+${tier.unlockMinutes} min)`;

  const params: import('@stripe/stripe-react-native').PlatformPay.ConfirmParams =
    Platform.OS === 'ios'
      ? {
          applePay: {
            cartItems: [
              {
                label,
                amount,
                paymentType: PlatformPay.PaymentType.Immediate,
              } satisfies import('@stripe/stripe-react-native').PlatformPay.ImmediateCartSummaryItem,
            ],
            merchantCountryCode: 'US',
            currencyCode: 'USD',
          },
        }
      : {
          googlePay: {
            testEnv: __DEV__,
            merchantName: 'SCROLL',
            merchantCountryCode: 'US',
            currencyCode: 'USD',
          },
        };

  const { error } = await confirmPlatformPayPayment(clientSecret, params);

  if (error) {
    if (error.code === 'Canceled') {
      return { success: false, error: 'Payment canceled' };
    }
    return { success: false, error: error.message ?? 'Wallet payment failed' };
  }

  return confirmOnServer(paymentIntentId);
}

export async function payUnlockWithStripe(tier: PaymentTier): Promise<PaymentResult> {
  if (!isStripeNativeAvailable()) {
    return {
      success: false,
      error: 'Real payments need a dev build (expo run:ios / run:android).',
    };
  }

  const { initPaymentSheet, presentPaymentSheet } = await import(
    '@stripe/stripe-react-native'
  );

  const intent = await createPaymentIntent(tier, 'payment_sheet');
  if ('error' in intent) {
    return { success: false, error: intent.error };
  }

  const { clientSecret, paymentIntentId } = intent;

  const applePay =
    Platform.OS === 'ios'
      ? {
          merchantCountryCode: 'US',
        }
      : undefined;
  const googlePay =
    Platform.OS === 'android'
      ? {
          merchantCountryCode: 'US',
          testEnv: __DEV__,
          amount: formatDollars(tier.amountCents),
          label: tier.label,
        }
      : undefined;

  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'SCROLL',
    applePay,
    googlePay,
    allowsDelayedPaymentMethods: false,
    returnURL: 'scroll://unlock/pay',
  });

  if (initError) {
    return {
      success: false,
      error: initError.message ?? 'Could not open payment sheet',
    };
  }

  const { error: presentError } = await presentPaymentSheet();

  if (presentError) {
    if (presentError.code === 'Canceled') {
      return { success: false, error: 'Payment canceled' };
    }
    return { success: false, error: presentError.message };
  }

  return confirmOnServer(paymentIntentId);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY && isStripeNativeAvailable());
}
