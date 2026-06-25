import type { ComponentType, ReactNode } from 'react';
import { isExpoGo } from '@/lib/expoGo';

type StripeProviderProps = {
  publishableKey: string;
  merchantIdentifier?: string;
  urlScheme?: string;
  children: ReactNode;
};

let stripeProvider: ComponentType<StripeProviderProps> | null | undefined;

/** True when the native Stripe SDK is linked in the current binary. */
export function isStripeNativeAvailable(): boolean {
  return getStripeProvider() !== null;
}

export function getStripeProvider(): ComponentType<StripeProviderProps> | null {
  if (isExpoGo() || !process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return null;
  }

  if (stripeProvider !== undefined) {
    return stripeProvider;
  }

  try {
    stripeProvider = require('@stripe/stripe-react-native').StripeProvider ?? null;
  } catch {
    stripeProvider = null;
  }

  return stripeProvider ?? null;
}
