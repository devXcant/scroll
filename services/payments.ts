/**
 * Payments: Stripe PaymentSheet + Apple Pay / Google Pay via backend.
 * Secret key lives only in server/.env
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPayUnlockCountToday } from './antiCheat';
import { isExpoGo } from '@/lib/expoGo';
import {
  isStripeConfigured,
  payUnlockWithStripe,
  payUnlockWithWallet,
} from './stripeUnlock';
import type { PaymentTier } from '@/types';

/** SecureStore keys: alphanumeric, ".", "-", "_" only */
const ESCALATION_KEY = 'scroll_pay_escalation';

export function getEscalatingTier(appId?: string): PaymentTier {
  const count = getPayUnlockCountToday(appId);
  const tiers: PaymentTier[] = [
    { amountCents: 100, label: '$1.00', unlockMinutes: 15 },
    { amountCents: 500, label: '$5.00', unlockMinutes: 20 },
    { amountCents: 1000, label: '$10.00', unlockMinutes: 25 },
    { amountCents: 2000, label: '$20.00', unlockMinutes: 30 },
    { amountCents: 5000, label: '$50.00', unlockMinutes: 45 },
  ];
  const index = Math.min(count, tiers.length - 1);
  return tiers[index];
}

export type PaymentMethod = 'apple_pay' | 'google_pay' | 'card' | 'sheet';

export type PaymentResult = {
  success: boolean;
  paymentIntentId?: string;
  investedCents?: number;
  platformCents?: number;
  error?: string;
};

async function recordDevEscalation(): Promise<void> {
  const value = String(Date.now());
  try {
    await SecureStore.setItemAsync(ESCALATION_KEY, value);
  } catch {
    await AsyncStorage.setItem(ESCALATION_KEY, value);
  }
}

/** Unlock payment — native wallet (Apple/Google Pay) or Stripe card sheet */
export async function createUnlockPayment(
  method: PaymentMethod,
  tier: PaymentTier
): Promise<PaymentResult> {
  if (isStripeConfigured()) {
    if (method === 'apple_pay' || method === 'google_pay') {
      return payUnlockWithWallet(tier);
    }
    return payUnlockWithStripe(tier);
  }

  if (isExpoGo()) {
    await recordDevEscalation();
    const invested = Math.round(tier.amountCents * 0.8);
    const platform = tier.amountCents - invested;
    return {
      success: true,
      paymentIntentId: `pi_dev_${Date.now()}`,
      investedCents: invested,
      platformCents: platform,
    };
  }

  return {
    success: false,
    error:
      'Payments not configured. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY and EXPO_PUBLIC_API_URL, run the API server.',
  };
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export { isStripeConfigured } from './stripeUnlock';
